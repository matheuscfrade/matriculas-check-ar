import { roundMoney, toNumber, type Row } from "./cell";
import { formatarCpf } from "./formatCpf";
import { formatDate } from "./formatDate";

const NUMBER_COLS = new Set([
  "N° INSCRIÇÃO",
  "Nº INSCRIÇÃO",
  "NÚMERO DE INSCRIÇÃO",
  "VALOR RECEBIDO",
  "QUANTIDADE",
  "VALOR PAGO",
  "VALOR",
  "BOLSA",
]);

const DATE_COLS = new Set([
  "DATA DE NASCIMENTO",
  "INÍCIO CICLO",
  "FINAL CICLO",
  "PERÍODO IMPEDITIVO",
]);

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

function isCpfCol(column: string): boolean {
  return /cpf/i.test(column);
}

function isDateCol(column: string): boolean {
  const upper = column.trim().toUpperCase();
  return DATE_COLS.has(upper) || /^DATA\b/.test(upper);
}

function isNumberCol(column: string): boolean {
  return NUMBER_COLS.has(column.trim().toUpperCase());
}

function isPlaceholder(value: string): boolean {
  return /[A-Za-zÀ-ÿ]/.test(value);
}

export function formatOutputCell(
  column: string,
  value: unknown,
): string | number {
  if (isBlank(value)) return "";

  if (isCpfCol(column)) return formatarCpf(value);

  if (isDateCol(column)) return formatDate(value);

  if (isNumberCol(column)) {
    if (typeof value === "string" && isPlaceholder(value)) return value.trim();
    const n = toNumber(value);
    return /valor/i.test(column) ? roundMoney(n) : n;
  }

  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return formatDate(value);
  return String(value);
}

export function formatOutputRow(row: Row): Row {
  const out: Row = {};
  for (const [column, value] of Object.entries(row)) {
    out[column] = formatOutputCell(column, value);
  }
  return out;
}

export type OutputKind = "cpf" | "date" | "number" | "text";

export function outputKind(column: string): OutputKind {
  if (isCpfCol(column)) return "cpf";
  if (isDateCol(column)) return "date";
  if (isNumberCol(column)) return "number";
  return "text";
}
