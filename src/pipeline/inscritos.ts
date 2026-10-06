import { cell, cellStr, type Row } from "./cell";
import { formatarCpf } from "./formatCpf";
import { ifTrocar, remap } from "./maps";
import { extractEdital } from "./sistema";

export const INSCRITOS_COLS = [
  "EDITAL",
  "NÚMERO DE INSCRIÇÃO",
  "CPF",
  "NOME CIVIL",
  "INSTITUTO",
  "CURSO",
  "TURNO",
] as const;

const CAMPOS_INSCRICAO = [
  "EDITAL",
  "NÚMERO DE INSCRIÇÃO",
  "NOME CIVIL",
  "INSTITUTO",
  "CURSO",
  "TURNO",
] as const;

export function processInscritos(rows: Row[]): Row[] {
  return rows.map((row) => ({
    EDITAL: extractEdital(cellStr(row, "EDITAL")),
    "NÚMERO DE INSCRIÇÃO": cell(row, "NÚMERO DE INSCRIÇÃO") ?? "",
    CPF: formatarCpf(cell(row, "CPF")),
    "NOME CIVIL": cellStr(row, "NOME CIVIL"),
    INSTITUTO: remap(cellStr(row, "INSTITUTO"), ifTrocar),
    CURSO: cellStr(row, "CURSO"),
    TURNO: cellStr(row, "TURNO"),
  }));
}

function campoInscricao(match: Row | null, key: string): unknown {
  if (!match) return "Não encontrado";
  const value = match[key];
  if (value == null) return "Não encontrado";
  return value;
}

function linhaFaltante(falta: Row, match: Row | null): Row {
  const out: Row = {
    CPF: formatarCpf(falta.CPF),
  };
  for (const key of CAMPOS_INSCRICAO) {
    out[`${key}_INSCRIÇÃO`] = campoInscricao(match, key);
  }
  out.Nome = falta.Nome;
  out.Instituto = falta.Instituto;
  out.Descrição = falta.Descrição;
  out["Valor pago"] = falta["Valor pago"];
  return out;
}

export function cruzarFaltantes(faltantes: Row[], inscritos: Row[]): Row[] {
  const byCpf = new Map<string, Row[]>();
  for (const row of inscritos) {
    const cpf = formatarCpf(row.CPF);
    const list = byCpf.get(cpf) ?? [];
    list.push(row);
    byCpf.set(cpf, list);
  }

  const out: Row[] = [];
  for (const falta of faltantes) {
    const matches = byCpf.get(formatarCpf(falta.CPF));
    if (!matches || matches.length === 0) {
      out.push(linhaFaltante(falta, null));
      continue;
    }
    for (const match of matches) {
      out.push(linhaFaltante(falta, match));
    }
  }

  out.sort((a, b) => {
    const cpf = String(a.CPF).localeCompare(String(b.CPF), "pt-BR");
    if (cpf !== 0) return cpf;
    return String(a["NÚMERO DE INSCRIÇÃO_INSCRIÇÃO"]).localeCompare(
      String(b["NÚMERO DE INSCRIÇÃO_INSCRIÇÃO"]),
      "pt-BR",
      { numeric: true },
    );
  });
  return out;
}
