export function formatarCpf(cpf: unknown): string {
  const digits = String(cpf ?? "").replace(/[^\d]/g, "");
  const padded = digits.length < 11 ? digits.padStart(11, "0") : digits;
  if (padded.length === 11) {
    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9)}`;
  }
  return digits;
}
