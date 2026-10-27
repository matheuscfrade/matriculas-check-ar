import { cell, cellStr, roundMoney, toNumber, type Row } from "./cell";
import { formatarCpf } from "./formatCpf";

export type ConveniarFile = {
  instituto: string;
  rows: Row[];
};

export const INSTITUTOS_CONVENIAR = [
  "IFES",
  "IFF",
  "IFMG",
  "IFPE",
  "IFPR",
  "IFSP",
  "IFSUL",
] as const;

const INSTITUTOS_NOTEBOOK = new Set<string>(INSTITUTOS_CONVENIAR);

function cursoDoHistorico(historico: string): string {
  return historico.match(/;([^;]+);/)?.[1] ?? "";
}

function institutoDaLinha(row: Row, fallback: string): string {
  const projeto = cellStr(row, "Projeto");
  const found = INSTITUTOS_CONVENIAR.find((code) =>
    new RegExp(`(^|[^A-Za-z])${code}([^A-Za-z]|$)`, "i").test(projeto),
  );
  return found ?? fallback;
}

export function processConveniar(files: ConveniarFile[]): Row[] {
  const linhas: Row[] = [];

  for (const file of files) {
    for (const row of file.rows) {
      const instituto = institutoDaLinha(row, file.instituto);
      if (!INSTITUTOS_NOTEBOOK.has(instituto)) continue;
      const cpf = formatarCpf(cell(row, "CPF/CNPJ", "CPF"));
      linhas.push({
        CPF: cpf,
        Nome: cellStr(row, "Favorecido", "Empresa / Pessoa / Projeto", "Nome"),
        Instituto: instituto,
        Descrição: cursoDoHistorico(cellStr(row, "Histórico", "Historico")),
        "Valor pago": roundMoney(
          toNumber(cell(row, "Valor pago", "Valor")),
        ),
      });
    }
  }

  const grouped = new Map<string, Row>();
  for (const row of linhas) {
    const key = `${row.CPF}|${row.Nome}|${row.Instituto}`;
    const prev = grouped.get(key);
    if (!prev) {
      grouped.set(key, { ...row });
    } else {
      prev["Valor pago"] = roundMoney(
        toNumber(prev["Valor pago"]) + toNumber(row["Valor pago"]),
      );
    }
  }
  return [...grouped.values()];
}

export function valorPagoPorCpf(institutos: Row[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of institutos) {
    const cpf = String(row.CPF);
    map.set(cpf, roundMoney((map.get(cpf) ?? 0) + toNumber(row["Valor pago"])));
  }
  return map;
}
