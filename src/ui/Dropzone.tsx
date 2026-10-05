import { useId, useRef, useState, type DragEvent, type ChangeEvent } from "react";

type DropzoneProps = {
  onFiles: (files: File[]) => void;
};

export function Dropzone({ onFiles }: DropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);

  function take(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
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

  return (
    <div
      className={over ? "dropzone is-over" : "dropzone"}
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
        accept=".xlsx,.xls,.csv"
        multiple
        onChange={onChange}
      />
      <label htmlFor={inputId} className="dropzone-label">
        <span className="dropzone-title">Solte as planilhas aqui</span>
        <span className="dropzone-hint">ou clique para escolher</span>
        <span className="dropzone-types">.xlsx · .xls · .csv</span>
      </label>
      <p className="dropzone-seal">Uso interno · dados não saem daqui</p>
    </div>
  );
}
