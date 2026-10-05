import { roundMoney, toNumber, type Row } from "./cell";
import { processConveniar, valorPagoPorCpf, type ConveniarFile } from "./conveniar";
import { formatarCpf } from "./formatCpf";
import {
  cpfsDosEditais,
  idsFinalizados,
  semCpfs,
} from "./matriculados";
import { toPlanilhaCpfRow } from "./planilhaCols";
import { processSistema } from "./sistema";

export type PipelineInput = {
  conveniar: ConveniarFile[];
  equipe: Row[];
  sistema: Row[];
  planilhaAntiga: Row[];
  matriculados?: Row[];
  now?: Date;
};

export type PipelineResult = {
  ausentes: Row[];
  novos: Row[];
  planilhaCpf: Row[];
  resumo: {
    conveniar: number;
    noSistema: number;
    ausentes: number;
    novos: number;
    cpfs2024: number;
  };
};

function bolsaDeValor(valor: number): number | "Conferir" {
  return valor === 660 || valor === 858 ? valor : "Conferir";
}

function inscricaoKey(value: unknown): string {
  return String(value ?? "").trim();
}

export function runPipeline(input: PipelineInput): PipelineResult {
  const matriculados = input.matriculados ?? [];
  const cpfs2024 = cpfsDosEditais(matriculados);
  const finalizados = idsFinalizados(matriculados);

  const institutos = semCpfs(
    processConveniar(input.conveniar, input.equipe),
    cpfs2024,
  );
  const pagos = valorPagoPorCpf(institutos);
  const sistema = processSistema(input.sistema, input.now);
  const cpfsSistema = new Set(sistema.map((row) => String(row.CPF)));
  const sistemaConveniar = sistema.filter((row) => pagos.has(String(row.CPF)));

  const ausentes = institutos
    .filter((row) => !cpfsSistema.has(String(row.CPF)))
    .sort((a, b) =>
      `${a.Instituto}|${a.Descrição}|${a.Nome}`.localeCompare(
        `${b.Instituto}|${b.Descrição}|${b.Nome}`,
        "pt-BR",
      ),
    );

  const desistencia = new Map<string, Pick<Row, "DESISTIU?" | "DATA DA DESISTÊNCIA">>();
  for (const row of sistema) {
    desistencia.set(inscricaoKey(row["N° INSCRIÇÃO"]), {
      "DESISTIU?": row["DESISTIU?"],
      "DATA DA DESISTÊNCIA": row["DATA DA DESISTÊNCIA"],
    });
  }

  const antiga: Row[] = input.planilhaAntiga.map((row) => {
    const extra = desistencia.get(inscricaoKey(row["N° INSCRIÇÃO"]));
    return {
      ...row,
      CPF: formatarCpf(row.CPF),
      "DESISTIU?": extra?.["DESISTIU?"] ?? row["DESISTIU?"] ?? "",
      "DATA DA DESISTÊNCIA":
        extra?.["DATA DA DESISTÊNCIA"] ?? row["DATA DA DESISTÊNCIA"] ?? "",
      OBSERVAÇÃO: "OK",
    };
  });
  const cpfsAntiga = new Set(antiga.map((row) => String(row.CPF)));

  const novos: Row[] = sistemaConveniar
    .filter((row) => !cpfsAntiga.has(String(row.CPF)))
    .map((row) => {
      const valor = pagos.get(String(row.CPF)) ?? 0;
      return {
        ...row,
        "VALOR RECEBIDO": roundMoney(valor),
        BOLSA: bolsaDeValor(valor),
        OBSERVAÇÃO: "Novo Registro",
      };
    });

  const planilhaCpf: Row[] = [...antiga, ...novos]
    .map((row) => {
      if (row.OBSERVAÇÃO !== "OK") return row;
      const valor = pagos.get(String(row.CPF));
      if (valor == null) {
        const id = inscricaoKey(row["N° INSCRIÇÃO"]);
        return {
          ...row,
          OBSERVAÇÃO: finalizados.has(id) ? "Curso Finalizado" : "Sem pagamento",
        };
      }
      return {
        ...row,
        "VALOR RECEBIDO": roundMoney(toNumber(row["VALOR RECEBIDO"]) + valor),
        QUANTIDADE: toNumber(row.QUANTIDADE) + 1,
      };
    })
    .map(toPlanilhaCpfRow);

  return {
    ausentes,
    novos,
    planilhaCpf,
    resumo: {
      conveniar: institutos.length,
      noSistema: sistemaConveniar.length,
      ausentes: ausentes.length,
      novos: novos.length,
      cpfs2024: cpfs2024.length,
    },
  };
}
