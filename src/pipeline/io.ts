import * as XLSX from "xlsx";
import type { Row } from "./cell";
import { formatOutputCell, outputKind } from "./formatOutput";
import { readXlsx } from "./xlsxRead";

const READ_OPTS: XLSX.ParsingOptions = {
  type: "array",
  dense: true,
  sheets: 0,
  cellDates: true,
  cellHTML: false,
  cellFormula: false,
  cellStyles: false,
  cellText: false,
  sheetStubs: false,
};

function shrinkUsedRange(sheet: XLSX.WorkSheet) {
  let minR = Infinity;
  let minC = Infinity;
  let maxR = 0;
  let maxC = 0;
  let found = false;

  if (Array.isArray(sheet)) {
    for (let r = 0; r < sheet.length; r += 1) {
      const row = sheet[r] as unknown[] | undefined;
      if (!row) continue;
      for (let c = 0; c < row.length; c += 1) {
        if (row[c] == null) continue;
        found = true;
        if (r < minR) minR = r;
        if (c < minC) minC = c;
        if (r > maxR) maxR = r;
        if (c > maxC) maxC = c;
      }
    }
  } else {
    for (const key of Object.keys(sheet)) {
      if (key.charAt(0) === "!") continue;
      const { r, c } = XLSX.utils.decode_cell(key);
      found = true;
      if (r < minR) minR = r;
      if (c < minC) minC = c;
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    }
  }

  if (found) {
    sheet["!ref"] = XLSX.utils.encode_range({
      s: { r: minR, c: minC },
      e: { r: maxR, c: maxC },
    });
  }
}

function asBytes(buffer: ArrayBuffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function foldSheetName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function pickSheetName(names: string[], preferSheet?: string): string | undefined {
  if (preferSheet) {
    const want = foldSheetName(preferSheet);
    const match = names.find((name) => foldSheetName(name) === want);
    if (match) return match;
  }
  return names[0];
}

function readWithSheetJS(
  buffer: ArrayBuffer | Uint8Array,
  preferSheet?: string,
): { headers: string[]; rows: Row[] } {
  const opts = preferSheet ? { ...READ_OPTS, sheets: undefined } : READ_OPTS;
  const wb = XLSX.read(buffer, opts);
  const name = pickSheetName(wb.SheetNames, preferSheet);
  if (!name) return { headers: [], rows: [] };
  const sheet = wb.Sheets[name];
  if (!sheet) return { headers: [], rows: [] };
  shrinkUsedRange(sheet);
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
    raw: true,
    blankrows: false,
  });
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export function readSheet(
  buffer: ArrayBuffer | Uint8Array,
  opts?: { preferSheet?: string },
): { headers: string[]; rows: Row[] } {
  const bytes = asBytes(buffer);
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return readXlsx(bytes, opts?.preferSheet);
  }
  return readWithSheetJS(bytes, opts?.preferSheet);
}

function sheetHeader(rows: Row[]): string[] {
  const seen: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (/^\d+$/.test(key)) continue;
      if (!seen.includes(key)) seen.push(key);
    }
  }
  const editalAt = seen.indexOf("EDITAL");
  if (editalAt > 0) {
    seen.splice(editalAt, 1);
    seen.unshift("EDITAL");
  }
  return seen;
}

function applyColumnFormats(sheet: XLSX.WorkSheet, headers: string[]) {
  const ref = sheet["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const kind = outputKind(headers[c] ?? "");
    for (let r = range.s.r + 1; r <= range.e.r; r += 1) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr] as XLSX.CellObject | undefined;
      if (!cell) continue;
      if (kind === "number" && typeof cell.v === "number") {
        cell.t = "n";
        continue;
      }
      cell.t = "s";
      cell.v = String(cell.v ?? "");
      cell.z = "@";
      delete cell.w;
    }
  }
}

export function rowsToWorkbook(rows: Row[], sheetName: string): ArrayBuffer {
  const header = sheetHeader(rows);
  const body = rows.map((row) => {
    const out: Row = {};
    for (const col of header) {
      out[col] = formatOutputCell(col, row[col]);
    }
    return out;
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(body, { header });
  applyColumnFormats(ws, header);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  return XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  }) as ArrayBuffer;
}

export function downloadXlsx(rows: Row[], filename: string, sheetName: string) {
  const buffer = rowsToWorkbook(rows, sheetName);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function messageForReadError(error: unknown, filename: string): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    /array buffer allocation failed|invalid array length|out of memory|allocation failed|invalid string length/i.test(
      msg,
    )
  ) {
    return `Memória insuficiente ao ler ${filename}. Feche outras abas e tente de novo. Se o Excel for muito grande, salve só a primeira aba como CSV e envie o CSV.`;
  }
  return `Falha ao ler ${filename}: ${msg}`;
}
