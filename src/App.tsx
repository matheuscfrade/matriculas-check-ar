import { useState } from "react";
import { addFiles, clearFiles, removeFile } from "./files/store";
import type { FileError, FileHandle } from "./files/types";
import { classifyByName, classifyFile, missingRequiredRoles } from "./pipeline/classify";
import { messageForReadError, readSheet } from "./pipeline/io";
import { runPipeline, type PipelineResult } from "./pipeline/run";
import type { ConveniarFile } from "./pipeline/conveniar";
import { cell, type Row } from "./pipeline/cell";
import { ABA_MATRICULAS_CONSOLIDADAS } from "./pipeline/matriculados";
import { Dropzone } from "./ui/Dropzone";
import { FileList } from "./ui/FileList";
import { PrivacyBanner } from "./ui/PrivacyBanner";
import { Results } from "./ui/Results";

const CONVENIAR_COLS = [
  "CPF/CNPJ",
  "CPF",
  "Favorecido",
  "Nome",
  "Histórico",
  "Historico",
  "Valor",
  "Valor pago",
];

const SISTEMA_COLS = [
  "CATEGORIA DO CURSO",
  "CONCORRÊNCIA/ AÇÃO AFIRMATIVA",
  "CONCORRÊNCIA/AÇÃO AFIRMATIVA",
  "RENDA PER CAPITA",
  "DATA DE NASCIMENTO",
  "NÚMERO DE INSCRIÇÃO",
  "EDITAL",
  "NOME CIVIL",
  "CPF",
  "CURSO",
  "INSTITUTO",
  "CIDADE DO CAMPUS",
  "ESTADO",
  "CIDADE",
  "BAIRRO",
  "SEXO",
  "ESCOLARIDADE",
  "DESISTÊNCIA",
  "DESISTIU?",
  "DATA DA DESISTÊNCIA",
];

const MATRICULADOS_COLS = ["Edital", "ID", "CPF", "Status"];

function pickColumns(rows: Row[], names: string[]): Row[] {
  return rows.map((row) => {
    const out: Row = {};
    for (const name of names) {
      const value = cell(row, name);
      if (value !== undefined) out[name] = value;
    }
    return out;
  });
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function missingRoles(files: FileHandle[]): string[] {
  return missingRequiredRoles(files.map((file) => file.name));
}

export default function App() {
  const [files, setFiles] = useState<FileHandle[]>([]);
  const [errors, setErrors] = useState<FileError[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);

  function onFiles(incoming: File[]) {
    const { next, errors: nextErrors } = addFiles(files, incoming);
    setFiles(next);
    setErrors(nextErrors);
    setResult(null);
    setRunError(null);
  }

  function onRemove(id: string) {
    setFiles((current) => removeFile(current, id));
    setResult(null);
  }

  function onClear() {
    setFiles(clearFiles());
    setErrors([]);
    setResult(null);
    setRunError(null);
  }

  const missing = missingRoles(files);
  const canRun = missing.length === 0 && !busy;

  async function cruzar() {
    setBusy(true);
    setRunError(null);
    setResult(null);
    try {
      const conveniar: ConveniarFile[] = [];
      let equipe: Row[] = [];
      let sistema: Row[] = [];
      let planilhaAntiga: Row[] = [];
      let matriculados: Row[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const handle = files[i];
        if (!handle) continue;
        setProgress(`Lendo ${handle.name} (${i + 1}/${files.length})`);
        let rows: Row[];
        let headers: string[];
        try {
          const buffer = await handle.file.arrayBuffer();
          const byName = classifyByName(handle.name);
          const parsed = readSheet(
            buffer,
            byName.role === "matriculados"
              ? { preferSheet: ABA_MATRICULAS_CONSOLIDADAS }
              : undefined,
          );
          rows = parsed.rows;
          headers = parsed.headers;
        } catch (error) {
          setRunError(messageForReadError(error, handle.name));
          return;
        }
        const classified = classifyFile(handle.name, headers);
        if (classified.role === "conveniar") {
          conveniar.push({
            instituto: classified.instituto ?? "DESCONHECIDO",
            rows: pickColumns(rows, CONVENIAR_COLS),
          });
        } else if (classified.role === "equipe") {
          equipe = equipe.concat(pickColumns(rows, ["CPF"]));
        } else if (classified.role === "sistema") {
          sistema = sistema.concat(pickColumns(rows, SISTEMA_COLS));
        } else if (classified.role === "planilha_cpf") {
          planilhaAntiga = planilhaAntiga.concat(rows);
        } else if (classified.role === "matriculados") {
          matriculados = matriculados.concat(
            pickColumns(rows, MATRICULADOS_COLS),
          );
        }
        await yieldToBrowser();
      }

      if (
        conveniar.length === 0 ||
        sistema.length === 0 ||
        planilhaAntiga.length === 0 ||
        matriculados.length === 0
      ) {
        setRunError(
          "Não foi possível identificar todos os arquivos. Confira os nomes: LancamentosGestorFinanceiro, matriculados_sistema, Planilha CPF e Matriculados.",
        );
        return;
      }

      setProgress("Cruzando…");
      setResult(
        runPipeline({
          conveniar,
          equipe,
          sistema,
          planilhaAntiga,
          matriculados,
        }),
      );
    } catch (error) {
      setRunError(messageForReadError(error, "as planilhas"));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <h1>Matrículas Check A&R</h1>
        <p className="lede">Autonomia e Renda · FAIFSUL</p>
        <PrivacyBanner />
      </header>

      <main>
        <Dropzone onFiles={onFiles} />
        <FileList
          files={files}
          errors={errors}
          onRemove={onRemove}
          onClear={onClear}
        />

        <p className="soon">
          <button
            type="button"
            className={canRun ? "soon-btn is-ready" : "soon-btn"}
            disabled={!canRun}
            onClick={() => void cruzar()}
          >
            {busy ? (progress ?? "Cruzando…") : "Cruzar planilhas"}
          </button>
          <span>
            {missing.length > 0
              ? `Falta: ${missing.join("; ")}. Docentes e Equipe é opcional.`
              : "O cruzamento roda neste computador. Depois você baixa a Planilha CPF e os CPFs ausentes."}
          </span>
        </p>

        {runError ? (
          <p className="errors" role="alert">
            {runError}
          </p>
        ) : null}

        {result ? <Results result={result} /> : null}
      </main>
    </div>
  );
}
