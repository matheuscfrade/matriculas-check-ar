import { useId, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { formatBytes } from "../files/format";
import type { FileSlot } from "../files/slots";
import type { FileHandle } from "../files/types";

type SlotDropzoneProps = {
  slot: FileSlot;
  file: FileHandle | null;
  onFile: (files: File[]) => void;
  onRemove: () => void;
};

export function SlotDropzone({
  slot,
  file,
  onFile,
  onRemove,
}: SlotDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);

  function take(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const first = fileList[0];
    if (first) onFile([first]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current += 1;
    setOver(true);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function onDragLeave() {
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setOver(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setOver(false);
    take(event.dataTransfer.files);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    take(event.target.files);
  }

  const stateClass = [
    "slot",
    over ? "is-over" : "",
    file ? "is-filled" : "",
    slot.required ? "" : "is-optional",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={stateClass}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept=".xlsx,.csv"
        onChange={onChange}
      />
      <div className="slot-head">
        <label htmlFor={inputId} className="slot-label">
          <span className="slot-title">{slot.label}</span>
          {slot.required ? null : (
            <span className="slot-optional">opcional</span>
          )}
          <span className="slot-hint">{slot.hint}</span>
        </label>
      </div>
      {file ? (
        <div className="slot-file">
          <span className="file-name">{file.name}</span>
          <span className="file-size">{formatBytes(file.size)}</span>
          <button type="button" className="linkish" onClick={onRemove}>
            Remover
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="slot-empty">
          Solte o arquivo aqui ou clique para escolher
        </label>
      )}
    </div>
  );
}
