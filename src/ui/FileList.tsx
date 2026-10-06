import { fileErrorMessage } from "../files/messages";
import type { FileError, FileHandle } from "../files/types";

type FileListProps = {
  files: FileHandle[];
  errors: FileError[];
  onClear: () => void;
};

export function FileList({ files, errors, onClear }: FileListProps) {
  if (files.length === 0 && errors.length === 0) return null;

  const countLabel =
    files.length === 1
      ? "1 arquivo nesta sessão"
      : `${files.length} arquivos nesta sessão`;

  return (
    <section className="session" aria-live="polite">
      {errors.length > 0 ? (
        <ul className="errors" role="alert">
          {errors.map((error, index) => (
            <li key={`${index}-${error.name}`}>{fileErrorMessage(error)}</li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <div className="session-bar">
          <p className="session-count">{countLabel}</p>
          <button type="button" className="linkish" onClick={onClear}>
            Limpar tudo
          </button>
        </div>
      ) : null}
    </section>
  );
}
