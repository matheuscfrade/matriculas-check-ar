import type { Row } from "./cell";

function decodeText(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function detectDelimiter(text: string): "," | ";" {
  let commas = 0;
  let semis = 0;
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\n" || ch === "\r") break;
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (ch === ",") commas += 1;
    if (ch === ";") semis += 1;
  }
  return semis > commas ? ";" : ",";
}

function parseRows(text: string): string[][] {
  const delim = detectDelimiter(text);
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
        continue;
      }
      field += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === delim) {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  if (quoted) throw new Error("CSV com aspas sem fechar");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((line) => line.some((cell) => cell.trim() !== ""));
}

export function readCsv(bytes: Uint8Array): { headers: string[]; rows: Row[] } {
  const table = parseRows(decodeText(bytes));
  const headers = (table[0] ?? []).map((cell) => cell.trim());
  const rows: Row[] = [];
  for (let i = 1; i < table.length; i += 1) {
    const line = table[i] ?? [];
    const row: Row = {};
    let filled = false;
    const width = Math.max(headers.length, line.length);
    for (let c = 0; c < width; c += 1) {
      const header = headers[c];
      if (!header) continue;
      const value = (line[c] ?? "").trim();
      if (!value) continue;
      row[header] = value;
      filled = true;
    }
    if (filled) rows.push(row);
  }
  return { headers: headers.filter(Boolean), rows };
}
