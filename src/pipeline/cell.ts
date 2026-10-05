export type Row = Record<string, unknown>;

export function cell(row: Row, ...names: string[]): unknown {
  const keys = Object.keys(row);
  for (const name of names) {
    const want = name.trim().toLowerCase();
    const found = keys.find((key) => key.trim().toLowerCase() === want);
    if (found !== undefined) return row[found];
  }
  return undefined;
}

export function cellStr(row: Row, ...names: string[]): string {
  const value = cell(row, ...names);
  if (value == null) return "";
  return String(value);
}

export function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
