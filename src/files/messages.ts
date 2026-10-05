import type { RejectReason } from "./accept";

export function rejectMessage(name: string, reason: RejectReason): string {
  switch (reason) {
    case "type":
      return `${name}: CSV ou Excel (.xlsx, .xls). Este arquivo não entra.`;
    case "size":
      return `${name}: passa de 30 MB. Este arquivo não entra.`;
    case "count":
      return `${name}: a sessão já tem 30 arquivos. Este arquivo não entra.`;
  }
}
