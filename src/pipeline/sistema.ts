import { cell, cellStr, toNumber, type Row } from "./cell";
import { formatarCpf } from "./formatCpf";
import { formatDate } from "./formatDate";
import { calcularIdade, faixaEtaria } from "./idade";
import {
  escolaridadeTrocar,
  ifTrocar,
  ingressoTrocar,
  remap,
  rendaTrocar,
} from "./maps";

const EDITAL_RE = /n[º°]\s*(\d{2,3}\/\d{4})/i;

export function extractEdital(value: string): string {
  return value.match(EDITAL_RE)?.[1] ?? "";
}

export function processSistema(rows: Row[], agora = new Date()): Row[] {
  return rows.map((row) => {
    const tipo = cellStr(row, "CATEGORIA DO CURSO");
    const acao = remap(
      cellStr(row, "CONCORRÊNCIA/ AÇÃO AFIRMATIVA", "CONCORRÊNCIA/AÇÃO AFIRMATIVA"),
      ingressoTrocar,
    );
    let faixaRenda = remap(cellStr(row, "RENDA PER CAPITA"), rendaTrocar);
    if (
      tipo === "FIC" &&
      !["Entre 0,5 e 1 S.M", "Até 0,5 S.M."].includes(faixaRenda)
    ) {
      faixaRenda = "Até 0,5 S.M.";
    }
    if (
      tipo === "Técnico" &&
      ["LB_EP", "LB_PCD", "LB_PPI", "LB_Q"].includes(acao) &&
      !["Entre 0,5 e 1 S.M", "Até 0,5 S.M.", "Entre 1 e 1,5 S.M."].includes(
        faixaRenda,
      )
    ) {
      faixaRenda = "Entre 1 e 1,5 S.M.";
    }

    const nascimento = formatDate(cell(row, "DATA DE NASCIMENTO"));
    const inscricao = toNumber(cell(row, "NÚMERO DE INSCRIÇÃO"));

    return {
      EDITAL: extractEdital(cellStr(row, "EDITAL")),
      "N° INSCRIÇÃO": inscricao,
      "NOME COMPLETO": cellStr(row, "NOME CIVIL"),
      CPF: formatarCpf(cell(row, "CPF")),
      "DATA DE NASCIMENTO": nascimento,
      "ALUNO POSSUI TERMO DE CONSENTIMENTO?": "Não Informado",
      CURSO: cellStr(row, "CURSO"),
      UNIDADE: remap(cellStr(row, "INSTITUTO"), ifTrocar),
      CAMPUS: cellStr(row, "CIDADE DO CAMPUS"),
      "INÍCIO CICLO": "Não informado",
      "FINAL CICLO": "Não informado",
      "PERÍODO IMPEDITIVO": "Não informado",
      "SITUAÇÃO CURSO": "Não informado",
      "SITUAÇÃO MATRÍCULA": "Não informado",
      "STATUS FINAL": "Cursando",
      "ESTADO MORADIA": cellStr(row, "ESTADO"),
      "MUNICÍPIO MORADIA": cellStr(row, "CIDADE"),
      "COMUNIDADE MORADIA": cellStr(row, "BAIRRO"),
      GÊNERO: cellStr(row, "SEXO"),
      "AÇÃO AFIRMATIVA": acao,
      "FAIXA ETÁRIA": faixaEtaria(calcularIdade(nascimento, agora)),
      "FAIXA RENDA": faixaRenda,
      ESCOLARIDADE: remap(cellStr(row, "ESCOLARIDADE"), escolaridadeTrocar),
      BOLSA: "Não informado",
      "VALOR RECEBIDO": "Não informado",
      QUANTIDADE: "Não informado",
      "DESISTIU?": cellStr(row, "DESISTÊNCIA", "DESISTIU?"),
      "DATA DA DESISTÊNCIA": cell(row, "DATA DA DESISTÊNCIA") ?? "",
    };
  });
}
