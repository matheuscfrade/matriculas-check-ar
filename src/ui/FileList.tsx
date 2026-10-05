import { formatBytes } from "../files/format";
import { rejectMessage } from "../files/messages";
import type { FileError, FileHandle } from "../files/types";
import { classifyByName, roleLabel } from "../pipeline/classify";

type FileListProps = {
  files: FileHandle[];
  errors: FileError[];
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function FileList({ files, errors, onRemove, onClear }: FileListProps) {
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
            <li key={`${index}-${error.name}`}>
              {rejectMessage(error.name, error.reason)}
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <>
          <ul className="file-list">
            {files.map((handle) => (
              <li key={handle.id} className="file-row">
                <span className="file-name">
                  {handle.name}
                  <span className="file-role">
                    {roleLabel(classifyByName(handle.name))}
                  </span>
                </span>
                <span className="file-size">{formatBytes(handle.size)}</span>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => onRemove(handle.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <div className="session-bar">
            <p className="session-count">{countLabel}</p>
            <button type="button" className="linkish" onClick={onClear}>
              Limpar tudo
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
