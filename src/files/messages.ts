import type { FileError } from "./store";
import type { RejectReason } from "./accept";

export function rejectMessage(
  name: string,
  reason: RejectReason | "slot",
  detail?: string,
): string {
  if (reason === "slot") {
    return detail ?? `${name}: este arquivo não é o deste espaço.`;
  }
  switch (reason) {
    case "type":
      return `${name}: CSV ou Excel (.xlsx). Este arquivo não entra.`;
    case "size":
      return `${name}: passa de 30 MB. Este arquivo não entra.`;
    case "count":
      return `${name}: a sessão já tem 30 arquivos. Este arquivo não entra.`;
  }
}

export function fileErrorMessage(error: FileError): string {
  return rejectMessage(error.name, error.reason, error.detail);
}
