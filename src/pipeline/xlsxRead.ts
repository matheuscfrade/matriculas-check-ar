import { Inflate, strFromU8 } from "fflate";
import type { Row } from "./cell";
import { PLANILHA_CPF_COLS } from "./planilhaCols";

export const MAX_INFLATE_BYTES = 2 * 1024 * 1024 * 1024;
const ZIP64_SENTINEL = 0xffffffff;

function concatBytes(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function inflateCapped(payload: Uint8Array, claimed: number): Uint8Array {
  const known = claimed > 0 && claimed < ZIP64_SENTINEL;
  if (known && claimed > MAX_INFLATE_BYTES) {
    throw new Error("ZIP descomprimido grande demais");
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  let overflow = false;
  const inf = new Inflate((chunk) => {
    if (overflow) return;
    if (total + chunk.length > MAX_INFLATE_BYTES) {
      overflow = true;
      return;
    }
    total += chunk.length;
    chunks.push(chunk);
  });
  inf.push(payload, true);
  if (overflow) throw new Error("ZIP descomprimido grande demais");
  return concatBytes(chunks, total);
}

function u16(data: Uint8Array, i: number): number {
  return data[i]! | (data[i + 1]! << 8);
}

function u32(data: Uint8Array, i: number): number {
  return (
    (data[i]! |
      (data[i + 1]! << 8) |
      (data[i + 2]! << 16) |
      (data[i + 3]! << 24)) >>>
    0
  );
}

function u64(data: Uint8Array, i: number): number {
  const lo = u32(data, i);
  const hi = u32(data, i + 4);
  if (hi > 0x1fffff) return Number.POSITIVE_INFINITY;
  return hi * 4294967296 + lo;
}

function zip64Sizes(
  extra: Uint8Array,
  usz: number,
  csz: number,
  localOff: number,
): { usz: number; csz: number; localOff: number } {
  let i = 0;
  while (i + 4 <= extra.length) {
    const id = u16(extra, i);
    const size = u16(extra, i + 2);
    const start = i + 4;
    const end = start + size;
    if (end > extra.length) break;
    if (id === 1) {
      let p = start;
      if (usz === ZIP64_SENTINEL && p + 8 <= end) {
        usz = u64(extra, p);
        p += 8;
      }
      if (csz === ZIP64_SENTINEL && p + 8 <= end) {
        csz = u64(extra, p);
        p += 8;
      }
      if (localOff === ZIP64_SENTINEL && p + 8 <= end) {
        localOff = u64(extra, p);
      }
      return { usz, csz, localOff };
    }
    i = end;
  }
  return { usz, csz, localOff };
}

function readCentralDirectory(data: Uint8Array): { count: number; offset: number } {
  let eocd = data.length - 22;
  while (eocd >= 0 && u32(data, eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error("ZIP inválido");
  let count = u16(data, eocd + 10);
  let offset = u32(data, eocd + 16);
  if (count !== 0xffff && offset !== ZIP64_SENTINEL) {
    return { count, offset };
  }
  const loc = eocd - 20;
  if (loc < 0 || u32(data, loc) !== 0x07064b50) {
    if (count === 0xffff) throw new Error("ZIP inválido");
    return { count, offset };
  }
  const z64off = u64(data, loc + 8);
  if (!Number.isFinite(z64off) || u32(data, z64off) !== 0x06064b50) {
    throw new Error("ZIP inválido");
  }
  count = u64(data, z64off + 32);
  offset = u64(data, z64off + 48);
  if (!Number.isFinite(count) || !Number.isFinite(offset)) {
    throw new Error("ZIP inválido");
  }
  return { count, offset };
}

function normName(name: string): string {
  return name.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
}

function extractZip(
  data: Uint8Array,
  want: (name: string) => boolean,
): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  const { count, offset: startOffset } = readCentralDirectory(data);
  let offset = startOffset;
  for (let i = 0; i < count; i += 1) {
    if (u32(data, offset) !== 0x02014b50) throw new Error("ZIP inválido");
    const method = u16(data, offset + 10);
    let csz = u32(data, offset + 20);
    let usz = u32(data, offset + 24);
    const nameLen = u16(data, offset + 28);
    const extraLen = u16(data, offset + 30);
    const commentLen = u16(data, offset + 32);
    let localOff = u32(data, offset + 42);
    const name = normName(
      strFromU8(data.subarray(offset + 46, offset + 46 + nameLen)),
    );
    const extra = data.subarray(
      offset + 46 + nameLen,
      offset + 46 + nameLen + extraLen,
    );
    ({ usz, csz, localOff } = zip64Sizes(extra, usz, csz, localOff));
    offset += 46 + nameLen + extraLen + commentLen;
    if (!want(name)) continue;
    if (!Number.isFinite(localOff) || u32(data, localOff) !== 0x04034b50) {
      throw new Error("ZIP inválido");
    }
    const locName = u16(data, localOff + 26);
    const locExtraLen = u16(data, localOff + 28);
    const locExtra = data.subarray(
      localOff + 30 + locName,
      localOff + 30 + locName + locExtraLen,
    );
    const locSizes = zip64Sizes(
      locExtra,
      u32(data, localOff + 22),
      u32(data, localOff + 18),
      0,
    );
    if (csz === ZIP64_SENTINEL) csz = locSizes.csz;
    if (usz === ZIP64_SENTINEL) usz = locSizes.usz;
    const start = localOff + 30 + locName + locExtraLen;
    if (csz === ZIP64_SENTINEL || !Number.isFinite(csz)) {
      throw new Error("ZIP descomprimido grande demais");
    }
    const payload = data.subarray(start, start + csz);
    const claimed = usz === ZIP64_SENTINEL ? 0 : usz;
    if (claimed > MAX_INFLATE_BYTES || payload.length > MAX_INFLATE_BYTES) {
      throw new Error("ZIP descomprimido grande demais");
    }
    if (method === 0) out.set(name, payload);
    else if (method === 8) out.set(name, inflateCapped(payload, claimed));
    else throw new Error(`ZIP compactação ${method}`);
  }
  return out;
}

function xmlText(data: Uint8Array | undefined): string {
  return data && data.length ? strFromU8(data) : "";
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCharCode(Number(dec)),
    )
    .replace(/&amp;/g, "&");
}

function attr(tag: string, localName: string): string {
  const match = tag.match(
    new RegExp(
      `(?:^|\\s|:)${localName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
      "i",
    ),
  );
  return match?.[1] ?? match?.[2] ?? "";
}

function foldName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function sheetPath(
  workbookXml: string,
  relsXml: string,
  preferSheet?: string,
): string {
  const tags = workbookXml.match(/<(?:[\w]+:)?sheet\b[^>]*>/gi) ?? [];
  const want = preferSheet ? foldName(preferSheet) : "";
  const sheetTag =
    (want
      ? tags.find((tag) => foldName(attr(tag, "name")) === want)
      : undefined) ?? tags[0];
  const rid = sheetTag ? attr(sheetTag, "id") : "";
  if (rid && relsXml) {
    const rels = relsXml.match(/<(?:[\w]+:)?Relationship\b[^>]*>/gi) ?? [];
    for (const rel of rels) {
      if (attr(rel, "Id") !== rid && attr(rel, "id") !== rid) continue;
      const target = attr(rel, "Target") || attr(rel, "target");
      if (!target) break;
      const cleaned = target.replace(/\\/g, "/").replace(/^\/+/, "");
      return normName(cleaned.startsWith("xl/") ? cleaned : `xl/${cleaned}`);
    }
  }
  return "xl/worksheets/sheet1.xml";
}

function siText(inner: string): string {
  const withoutPh = inner.replace(
    /<(?:[\w]+:)?rPh\b[^>]*>[\s\S]*?<\/(?:[\w]+:)?rPh>/gi,
    "",
  );
  const parts = [
    ...withoutPh.matchAll(
      /<(?:[\w]+:)?t\b[^>]*(?:\/>|>([\s\S]*?)<\/(?:[\w]+:)?t>)/gi,
    ),
  ];
  return decodeXml(parts.map((part) => part[1] ?? "").join(""));
}

function parseSst(xml: string): string[] {
  if (!xml) return [];
  const out: string[] = [];
  const startRe = /<(?:[\w]+:)?si\b/gi;
  let start: RegExpExecArray | null;
  while ((start = startRe.exec(xml))) {
    const gt = xml.indexOf(">", start.index);
    if (gt < 0) break;
    if (xml[gt - 1] === "/") {
      out.push("");
      startRe.lastIndex = gt + 1;
      continue;
    }
    const rest = xml.slice(gt + 1);
    const close = rest.match(/<\/(?:[\w]+:)?si\s*>/i);
    if (!close || close.index == null) break;
    out.push(siText(rest.slice(0, close.index)));
    startRe.lastIndex = gt + 1 + close.index + close[0].length;
  }
  return out;
}

function colIndex(ref: string): number {
  let col = 0;
  for (let i = 0; i < ref.length; i += 1) {
    const code = ref.charCodeAt(i);
    if (code < 65 || code > 90) break;
    col = col * 26 + (code - 64);
  }
  return col - 1;
}

function innerText(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<(?:[\\w]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w]+:)?${tag}>`, "i"),
  );
  return match?.[1] ?? "";
}

function cellValue(inner: string, type: string, sst: string[]): unknown {
  if (type === "s") {
    const idx = Number(innerText(inner, "v"));
    return sst[idx] ?? "";
  }
  if (type === "inlineStr" || type === "str") {
    const texts = [
      ...inner.matchAll(/<(?:[\w]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w]+:)?t>/g),
    ];
    if (texts.length > 0) {
      return decodeXml(texts.map((part) => part[1] ?? "").join(""));
    }
    return decodeXml(innerText(inner, "v"));
  }
  if (type === "b") return innerText(inner, "v") === "1";
  if (type === "d") return decodeXml(innerText(inner, "v"));
  const raw = innerText(inner, "v").trim();
  if (!raw) return "";
  const num = Number(raw);
  return raw !== "" && Number.isFinite(num) ? num : decodeXml(raw);
}

function isHeaderLike(cells: unknown[]): boolean {
  const filled = cells.filter((cell) => cell !== undefined && cell !== "");
  if (filled.length === 0) return false;
  const labels = filled.filter((cell) => {
    const text = String(cell).trim();
    if (!text || /^\d+([.,]\d+)?$/.test(text)) return false;
    if (/^\d{2,3}\/\d{4}$/.test(text)) return false;
    return /[A-Za-zÀ-ÿ]/.test(text);
  });
  return labels.length >= Math.max(2, Math.ceil(filled.length / 2));
}

function looksLikePlanilhaData(cells: unknown[]): boolean {
  return (
    /^\d{2,3}\/\d{4}$/.test(String(cells[0] ?? "").trim()) &&
    Number.isFinite(Number(cells[1]))
  );
}

function asHeaderLabel(cell: unknown, sst: string[]): string {
  if (typeof cell === "number" && Number.isInteger(cell) && cell >= 0) {
    const fromSst = sst[cell];
    if (fromSst && /[A-Za-zÀ-ÿ]/.test(fromSst) && fromSst.trim().length >= 3) {
      return fromSst.trim();
    }
  }
  return String(cell ?? "").trim();
}

function sheetToRows(
  xml: string,
  sst: string[],
): { headers: string[]; rows: Row[] } {
  const table: unknown[][] = [];
  const rowRe = /<(?:[\w]+:)?row\b[^>]*>([\s\S]*?)<\/(?:[\w]+:)?row>/g;
  const cellRe =
    /<(?:[\w]+:)?c\b([^>]*?)\/>|<(?:[\w]+:)?c\b([^>]*)>([\s\S]*?)<\/(?:[\w]+:)?c>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowXml = rowMatch[1] ?? "";
    const values: unknown[] = [];
    cellRe.lastIndex = 0;
    let cellMatch: RegExpExecArray | null;
    let cursor = 0;
    while ((cellMatch = cellRe.exec(rowXml))) {
      const attrs = cellMatch[1] ?? cellMatch[2] ?? "";
      const inner = cellMatch[3] ?? "";
      const ref = attr(attrs, "r").toUpperCase();
      const type = attr(attrs, "t");
      const col = ref ? colIndex(ref) : cursor;
      values[col] = cellValue(inner, type, sst);
      cursor = col + 1;
    }
    if (values.some((value) => value !== undefined && value !== "")) {
      table.push(values);
    }
  }

  const headerIdx = table.findIndex(isHeaderLike);
  let headers: string[];
  let dataStart: number;
  if (headerIdx >= 0) {
    headers = (table[headerIdx] ?? []).map((cell) => asHeaderLabel(cell, sst));
    dataStart = headerIdx + 1;
  } else if (table[0] && looksLikePlanilhaData(table[0])) {
    headers = [...PLANILHA_CPF_COLS];
    dataStart = 0;
  } else {
    headers = (table[0] ?? []).map((cell) => asHeaderLabel(cell, sst));
    dataStart = 1;
  }

  const rows: Row[] = [];
  for (let i = dataStart; i < table.length; i += 1) {
    const line = table[i] ?? [];
    const width = Math.max(headers.length, line.length);
    const row: Row = {};
    let filled = false;
    for (let c = 0; c < width; c += 1) {
      const header = headers[c];
      if (!header) continue;
      const value = line[c];
      if (value === undefined || value === "") continue;
      row[header] = value;
      filled = true;
    }
    if (filled) rows.push(row);
  }
  return { headers: headers.filter(Boolean), rows };
}

export function readXlsx(
  data: Uint8Array,
  preferSheet?: string,
): { headers: string[]; rows: Row[] } {
  const meta = extractZip(
    data,
    (name) =>
      name === "xl/workbook.xml" ||
      name === "xl/_rels/workbook.xml.rels" ||
      name === "xl/sharedstrings.xml",
  );
  const path = sheetPath(
    xmlText(meta.get("xl/workbook.xml")),
    xmlText(meta.get("xl/_rels/workbook.xml.rels")),
    preferSheet,
  );
  const files = extractZip(data, (name) => name === path);
  const sheet = files.get(path);
  if (!sheet) throw new Error("Aba da planilha não encontrada");
  return sheetToRows(
    xmlText(sheet),
    parseSst(xmlText(meta.get("xl/sharedstrings.xml"))),
  );
}
