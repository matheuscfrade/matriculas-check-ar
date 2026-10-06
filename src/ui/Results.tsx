import { useState } from "react";
import { downloadXlsx, messageForReadError } from "../pipeline/io";
import type { PipelineResult } from "../pipeline/run";
import type { Row } from "../pipeline/cell";

type ResultsProps = {
  result: PipelineResult;
};

export function Results({ result }: ResultsProps) {
  const { resumo } = result;
  const [dlError, setDlError] = useState<string | null>(null);

  function save(rows: Row[], filename: string, sheetName: string) {
    try {
      downloadXlsx(rows, filename, sheetName);
      setDlError(null);
    } catch (error) {
      setDlError(messageForReadError(error, filename));
    }
  }

  return (
    <section className="results">
      <h2>Resultado</h2>
      <ul className="resumo">
        <li>
          {resumo.conveniar} pagamentos únicos no Conveniar (após excluir equipe
          e CPFs só de editais 2024)
        </li>
        <li>
          {resumo.cpfs2024} CPFs só de editais 2024 saíram do Conveniar
        </li>
        <li>
          A) {resumo.noSistema} registros que existem no Conveniar e estão no
          Sistema
        </li>
        <li>
          B) {resumo.ausentes} registros que existem no Conveniar e não estão no
          Sistema
        </li>
        <li>{resumo.novos} registros novos na Planilha CPF</li>
      </ul>
      <div className="downloads">
        <button
          type="button"
          className="soon-btn is-ready"
          onClick={() =>
            save(result.ausentes, "CPFs_ausentes.xlsx", "Ausentes")
          }
        >
          Baixar CPFs ausentes
        </button>
        <button
          type="button"
          className="soon-btn is-ready"
          onClick={() =>
            save(result.planilhaCpf, "PlanilhaCPF.xlsx", "Planilha CPF")
          }
        >
          Baixar Planilha CPF
        </button>
      </div>
      {dlError ? (
        <p className="errors" role="alert">
          {dlError}
        </p>
      ) : null}
    </section>
  );
}
