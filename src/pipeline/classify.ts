export type FileRole =
  | "conveniar"
  | "equipe"
  | "sistema"
  | "inscritos"
  | "planilha_cpf"
  | "matriculados"
  | "unknown";

export type Classified = {
  role: FileRole;
  instituto?: string;
};

const INSTITUTOS = [
  "IFSUL",
  "IFES",
  "IFRS",
  "IFSP",
  "IFPR",
  "IFPE",
  "IFMG",
  "IFF",
];

function institutoFromName(filename: string): string | undefined {
  const upper = filename.toUpperCase();
  return INSTITUTOS.find(
    (code) => upper.startsWith(code) || upper.includes(`${code}_`) || upper.includes(`${code}-`),
  );
}

export function classifyByName(filename: string): Classified {
  if (/docentes|equipe/i.test(filename)) return { role: "equipe" };
  if (/matriculados_sistema/i.test(filename)) return { role: "sistema" };
  if (/matriculados|matr[ií]culas\s*consolidadas/i.test(filename)) {
    return { role: "matriculados" };
  }
  if (/planilha\s*cpf/i.test(filename)) return { role: "planilha_cpf" };
  if (/inscric/i.test(filename)) return { role: "inscritos" };
  if (/lancamentos/i.test(filename)) {
    return {
      role: "conveniar",
      instituto: institutoFromName(filename) ?? "DESCONHECIDO",
    };
  }
  return { role: "unknown" };
}

export function classifyByHeaders(headers: string[]): FileRole {
  const h = headers.map((header) => header.trim().toLowerCase());
  if (h.includes("cpf/cnpj") && h.some((x) => x.includes("favorecido"))) {
    return "conveniar";
  }
  if (
    h.includes("turno") &&
    (h.includes("número de inscrição") || h.includes("nome civil"))
  ) {
    return "inscritos";
  }
  if (h.includes("número de inscrição") || h.includes("nome civil")) {
    return "sistema";
  }
  if (h.includes("nome completo") && h.includes("edital")) {
    return "planilha_cpf";
  }
  if (h.includes("edital") && h.includes("id") && h.includes("cpf")) {
    return "matriculados";
  }
  if (h.includes("cpf") && headers.length <= 8) return "equipe";
  return "unknown";
}

export function classifyFile(filename: string, headers: string[]): Classified {
  const byName = classifyByName(filename);
  const headerRole = classifyByHeaders(headers);
  if (
    byName.role !== "unknown" &&
    headerRole !== "unknown" &&
    byName.role !== headerRole
  ) {
    return { role: "unknown" };
  }
  if (byName.role !== "unknown") return byName;
  return {
    role: headerRole,
    instituto:
      headerRole === "conveniar"
        ? (institutoFromName(filename) ?? "DESCONHECIDO")
        : undefined,
  };
}

export function missingRequiredRoles(filenames: string[]): string[] {
  const roles = filenames.map((name) => classifyByName(name).role);
  const missing: string[] = [];
  if (!roles.includes("conveniar")) {
    missing.push("extrato Conveniar (IF…_LancamentosGestorFinanceiro)");
  }
  if (!roles.includes("sistema")) missing.push("matriculados_sistema");
  if (!roles.includes("inscritos")) missing.push("inscricoes-geral");
  if (!roles.includes("planilha_cpf")) missing.push("Planilha CPF antiga");
  if (!roles.includes("matriculados")) {
    missing.push("Matriculados (aba Matrículas Consolidadas)");
  }
  return missing;
}

export function roleLabel(classified: Classified): string {
  switch (classified.role) {
    case "conveniar":
      return `Conveniar · ${classified.instituto ?? "?"}`;
    case "equipe":
      return "Docentes e equipe";
    case "sistema":
      return "Matriculados do sistema";
    case "inscritos":
      return "Inscrições geral";
    case "planilha_cpf":
      return "Planilha CPF";
    case "matriculados":
      return "Matriculados";
    default:
      return "Não identificado";
  }
}
