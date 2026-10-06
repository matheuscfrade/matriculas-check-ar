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

function cpfDaLinha(row: Row): string | null {
  const raw = cell(row, "CPF");
  if (raw == null || String(raw).trim() === "") return null;
  return formatarCpf(raw);
}

export function cpfsDosEditais(
  rows: Row[],
  editais: readonly string[] = EDITAIS_2024,
): string[] {
  const wanted = new Set(editais);
  const bruto = new Set<string>();
  const preservar = new Set<string>();
  for (const row of rows) {
    const cpf = cpfDaLinha(row);
    if (!cpf) continue;
    if (wanted.has(cellStr(row, "Edital").trim())) bruto.add(cpf);
    else preservar.add(cpf);
  }
  return [...bruto].filter((cpf) => !preservar.has(cpf));
}

export type FinalizadoInfo = {
  situacaoMatricula: string;
  motivo: string;
};

export function infoFinalizados(rows: Row[]): Map<string, FinalizadoInfo> {
  const map = new Map<string, FinalizadoInfo>();
  for (const row of rows) {
    if (cellStr(row, "Status").trim() !== "Finalizado") continue;
    const id = String(cell(row, "ID") ?? "").trim();
    if (!id) continue;
    map.set(id, {
      situacaoMatricula: cellStr(
        row,
        "Situação de matrícula",
        "Situacao de matricula",
      ),
      motivo: cellStr(row, "Motivo"),
    });
  }
  return map;
}

export function idsFinalizados(rows: Row[]): Set<string> {
  return new Set(infoFinalizados(rows).keys());
}

const SITUACAO_MATRICULA: Record<string, string> = {
  Concluído: "CONCLUIDO",
  Evasão: "EVASÃO",
  Cancelada: "CANCELADO",
};

const MOTIVO_STATUS: Record<string, string> = {
  Aprovado: "APROVADO",
  Reprovado: "REPROVADO",
};

export function situacaoMatriculaFinal(value: string): string {
  return SITUACAO_MATRICULA[value] ?? "";
}

export function statusFinalDoMotivo(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return MOTIVO_STATUS[trimmed] ?? trimmed;
}

export function semCpfs(institutos: Row[], cpfs: Iterable<string>): Row[] {
  const skip = new Set([...cpfs].map((cpf) => formatarCpf(cpf)));
  return institutos.filter((row) => !skip.has(formatarCpf(row.CPF)));
}
