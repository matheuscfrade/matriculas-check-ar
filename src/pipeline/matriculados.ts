import { cell, cellStr, type Row } from "./cell";
import { formatarCpf } from "./formatCpf";

export const ABA_MATRICULAS_CONSOLIDADAS = "Matrículas Consolidadas";

export const EDITAIS_2024 = [
  "075/2024",
  "076/2024",
  "078/2024",
  "092/2024",
  "094/2024",
  "101/2024",
  "102/2024",
  "103/2024",
  "106/2024",
  "108/2024",
  "112/2024",
  "119/2024",
  "135/2024",
  "141/2024",
] as const;

export function cpfsDosEditais(
  rows: Row[],
  editais: readonly string[] = EDITAIS_2024,
): string[] {
  const wanted = new Set(editais);
  const cpfs: string[] = [];
  for (const row of rows) {
    if (!wanted.has(cellStr(row, "Edital").trim())) continue;
    cpfs.push(formatarCpf(cell(row, "CPF")));
  }
  return cpfs;
}

export function idsFinalizados(rows: Row[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (cellStr(row, "Status").trim() !== "Finalizado") continue;
    const id = String(cell(row, "ID") ?? "").trim();
    if (id) ids.add(id);
  }
  return ids;
}

export function semCpfs(institutos: Row[], cpfs: Iterable<string>): Row[] {
  const skip = new Set([...cpfs].map((cpf) => formatarCpf(cpf)));
  return institutos.filter((row) => !skip.has(formatarCpf(row.CPF)));
}
