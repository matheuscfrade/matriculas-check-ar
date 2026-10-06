import { useState } from "react";
import { missingSlots, slotById } from "./files/slots";
import { clearFiles, removeSlot, setSlotFile } from "./files/store";
import type { FileError, FileHandle } from "./files/types";
import {
  classifyByHeaders,
  classifyFile,
  roleFitsSlot,
} from "./pipeline/classify";
import { messageForReadError, readSheet } from "./pipeline/io";
import { runPipeline, type PipelineResult } from "./pipeline/run";
import type { ConveniarFile } from "./pipeline/conveniar";
import { cell, type Row } from "./pipeline/cell";
import { ABA_MATRICULAS_CONSOLIDADAS } from "./pipeline/matriculados";
import { FileList } from "./ui/FileList";
import { FileSlots } from "./ui/FileSlots";
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

const MATRICULADOS_COLS = [
  "Edital",
  "ID",
  "CPF",
  "Status",
  "Situação de matrícula",
  "Motivo",
];

const INSCRITOS_COLS = [
  "EDITAL",
  "NÚMERO DE INSCRIÇÃO",
  "CPF",
  "NOME CIVIL",
  "INSTITUTO",
  "CURSO",
  "TURNO",
];

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
  return missingSlots(files);
}

export default function App() {
  const [files, setFiles] = useState<FileHandle[]>([]);
  const [errors, setErrors] = useState<FileError[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);

  function onSlotFile(slotId: string, incoming: File[]) {
    const file = incoming[0];
    if (!file) return;
    const { next, errors: nextErrors } = setSlotFile(files, slotId, file);
    setFiles(next);
    setErrors(nextErrors);
    setResult(null);
    setRunError(null);
  }

  function onRemoveSlot(slotId: string) {
    setFiles((current) => removeSlot(current, slotId));
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
      let inscritos: Row[] = [];
      let planilhaAntiga: Row[] = [];
      let matriculados: Row[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const handle = files[i];
        if (!handle) continue;
        setProgress(`Lendo ${handle.name} (${i + 1}/${files.length})`);
        const slot = slotById(handle.slotId);
        let rows: Row[];
        let headers: string[];
        try {
          const buffer = await handle.file.arrayBuffer();
          const parsed = readSheet(
            buffer,
            slot?.role === "matriculados"
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
        const headerRole = classifyByHeaders(headers);
        if (slot && !roleFitsSlot(slot.role, headerRole)) {
          setRunError(
            `${handle.name}: o conteúdo não corresponde a ${slot.label}.`,
          );
          return;
        }
        const role = slot?.role ?? classified.role;
        const instituto =
          slot?.instituto ?? classified.instituto ?? "DESCONHECIDO";
        if (role === "conveniar") {
          conveniar.push({
            instituto,
            rows: pickColumns(rows, CONVENIAR_COLS),
          });
        } else if (role === "equipe") {
          equipe = equipe.concat(pickColumns(rows, ["CPF"]));
        } else if (role === "sistema") {
          sistema = sistema.concat(pickColumns(rows, SISTEMA_COLS));
        } else if (role === "inscritos") {
          inscritos = inscritos.concat(pickColumns(rows, INSCRITOS_COLS));
        } else if (role === "planilha_cpf") {
          planilhaAntiga = planilhaAntiga.concat(rows);
        } else if (role === "matriculados") {
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
          "Não foi possível identificar todos os arquivos. Confira cada espaço: um extrato Conveniar, matriculados_sistema, inscricoes-geral, Planilha CPF e Matriculados.",
        );
        return;
      }

      setProgress("Cruzando…");
      setResult(
        runPipeline({
          conveniar,
          equipe,
          sistema,
          inscritos,
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
        <FileSlots
          files={files}
          onSlotFile={onSlotFile}
          onRemoveSlot={onRemoveSlot}
        />
        <FileList files={files} errors={errors} onClear={onClear} />

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
              ? `Falta: ${missing.join("; ")}. Docentes e equipe é opcional.`
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
