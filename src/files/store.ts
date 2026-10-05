import { evaluateFile, type RejectReason } from "./accept";

export type FileHandle = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

export type FileError = {
  name: string;
  reason: RejectReason;
};

export type AddFilesResult = {
  next: FileHandle[];
  errors: FileError[];
};

export type AddFilesOptions = {
  idFactory?: () => string;
};

function newId(): string {
  return crypto.randomUUID();
}

export function addFiles(
  current: FileHandle[],
  incoming: File[],
  options: AddFilesOptions = {},
): AddFilesResult {
  const idFactory = options.idFactory ?? newId;
  const next = [...current];
  const errors: FileError[] = [];

  for (const file of incoming) {
    const result = evaluateFile(file, { currentCount: next.length });
    if (!result.ok) {
      errors.push({ name: file.name, reason: result.reason });
      continue;
    }
    next.push({
      id: idFactory(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    });
  }

  return { next, errors };
}

export function removeFile(current: FileHandle[], id: string): FileHandle[] {
  return current.filter((handle) => handle.id !== id);
}

export function clearFiles(): FileHandle[] {
  return [];
}
