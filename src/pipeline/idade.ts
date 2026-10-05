import { formatDate } from "./formatDate";

export function calcularIdade(dataNascimento: unknown, agora = new Date()): number {
  if (typeof dataNascimento !== "string" && !(dataNascimento instanceof Date)) {
    return 999;
  }
  const formatted = formatDate(dataNascimento);
  const match = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return 99;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const nasc = new Date(year, month - 1, day);
  if (
    nasc.getFullYear() !== year ||
    nasc.getMonth() !== month - 1 ||
    nasc.getDate() !== day
  ) {
    return 99;
  }
  const idade =
    agora.getFullYear() -
    nasc.getFullYear() -
    (agora.getMonth() < nasc.getMonth() ||
    (agora.getMonth() === nasc.getMonth() && agora.getDate() < nasc.getDate())
      ? 1
      : 0);
  return idade;
}

export function faixaEtaria(idade: number): string {
  if (idade < 18) return "Não Informado ou erro de declaração";
  if (idade <= 29) return "18 a 29";
  if (idade <= 39) return "30 a 39";
  if (idade <= 49) return "40 a 49";
  if (idade <= 59) return "50 a 59";
  if (idade <= 69) return "60 a 69";
  if (idade <= 98) return "70 e mais";
  return "Não Informado ou erro de declaração";
}
