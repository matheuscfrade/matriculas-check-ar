import * as XLSX from "xlsx";
import type { Row } from "./cell";
import { formatOutputCell, outputKind } from "./formatOutput";
import { readCsv } from "./csvRead";
import { readXlsx } from "./xlsxRead";

function asBytes(buffer: ArrayBuffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function looksLikeMarkup(bytes: Uint8Array): boolean {
  let i = 0;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    i = 3;
  }
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d)) {
    i += 1;
  }
  return bytes[i] === 0x3c;
}

export function readSheet(
  buffer: ArrayBuffer | Uint8Array,
  opts?: { preferSheet?: string },
): { headers: string[]; rows: Row[] } {
  const bytes = asBytes(buffer);
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return readXlsx(bytes, opts?.preferSheet);
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  ) {
    throw new Error("Arquivo .xls antigo. Salve como .xlsx ou CSV.");
  }
  if (looksLikeMarkup(bytes)) {
    throw new Error("Arquivo não é planilha CSV ou xlsx.");
  }
  return readCsv(bytes);
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
