import { evaluateFile, type RejectReason } from "./accept";
import { slotById, slotFileMismatch } from "./slots";

export type FileHandle = {
  id: string;
  slotId?: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

export type FileError = {
  name: string;
  reason: RejectReason | "slot";
  detail?: string;
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

export function setSlotFile(
  current: FileHandle[],
  slotId: string,
  file: File,
  options: AddFilesOptions = {},
): AddFilesResult {
  const slot = slotById(slotId);
  if (!slot) {
    return {
      next: current,
      errors: [{ name: file.name, reason: "slot", detail: "Espaço desconhecido." }],
    };
  }

  const mismatch = slotFileMismatch(slot, file.name);
  if (mismatch) {
    return {
      next: current,
      errors: [{ name: file.name, reason: "slot", detail: mismatch }],
    };
  }

  const rest = current.filter((handle) => handle.slotId !== slotId);
  const result = evaluateFile(file, { currentCount: rest.length });
  if (!result.ok) {
    return {
      next: current,
      errors: [{ name: file.name, reason: result.reason }],
    };
  }

  const idFactory = options.idFactory ?? newId;
  return {
    next: [
      ...rest,
      {
        id: idFactory(),
        slotId,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      },
    ],
    errors: [],
  };
}

export function removeFile(current: FileHandle[], id: string): FileHandle[] {
  return current.filter((handle) => handle.id !== id);
}

export function removeSlot(
  current: FileHandle[],
  slotId: string,
): FileHandle[] {
  return current.filter((handle) => handle.slotId !== slotId);
}

export function clearFiles(): FileHandle[] {
  return [];
}
