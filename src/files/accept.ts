export const MAX_FILE_MB = 150;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MAX_FILES = 30;
export const ACCEPTED_EXTENSIONS = [".xlsx", ".csv"] as const;

export type RejectReason = "type" | "size" | "count";

export type AcceptResult =
  | { ok: true }
  | { ok: false; reason: RejectReason };

export type FileLike = {
  name: string;
  size: number;
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
}

export function evaluateFile(
  file: FileLike,
  options: { currentCount?: number } = {},
): AcceptResult {
  const ext = extensionOf(file.name);
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, reason: "type" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: "size" };
  }
  if ((options.currentCount ?? 0) >= MAX_FILES) {
    return { ok: false, reason: "count" };
  }
  return { ok: true };
}
