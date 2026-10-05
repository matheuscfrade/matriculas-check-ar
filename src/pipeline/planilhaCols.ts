import { roundMoney, type Row } from "./cell";

export const PLANILHA_CPF_COLS = [
  "EDITAL",
  "N° INSCRIÇÃO",
  "NOME COMPLETO",
  "CPF",
  "DATA DE NASCIMENTO",
  "ALUNO POSSUI TERMO DE CONSENTIMENTO?",
  "CURSO",
  "UNIDADE",
  "CAMPUS",
  "INÍCIO CICLO",
  "FINAL CICLO",
  "PERÍODO IMPEDITIVO",
  "SITUAÇÃO CURSO",
  "SITUAÇÃO MATRÍCULA",
  "STATUS FINAL",
  "ESTADO MORADIA",
  "MUNICÍPIO MORADIA",
  "COMUNIDADE MORADIA",
  "GÊNERO",
  "AÇÃO AFIRMATIVA",
  "FAIXA ETÁRIA",
  "FAIXA RENDA",
  "ESCOLARIDADE",
  "BOLSA",
  "VALOR RECEBIDO",
  "QUANTIDADE",
  "DESISTIU?",
  "DATA DA DESISTÊNCIA",
  "OBSERVAÇÃO",
] as const;

export function toPlanilhaCpfRow(row: Row): Row {
  const out: Row = {};
  for (const col of PLANILHA_CPF_COLS) {
    let value = row[col];
    if (value === undefined && col === "N° INSCRIÇÃO") {
      value = row["Nº INSCRIÇÃO"] ?? row["NÚMERO DE INSCRIÇÃO"] ?? row["15"];
    }
    if (col === "VALOR RECEBIDO" && typeof value === "number" && Number.isFinite(value)) {
      value = roundMoney(value);
    }
    out[col] = value ?? "";
  }
  return out;
}
