import { classifyByName, roleLabel, type FileRole } from "../pipeline/classify";
import { INSTITUTOS_CONVENIAR } from "../pipeline/conveniar";

export type SlotGroup = "conveniar" | "bases";

export type FileSlot = {
  id: string;
  group: SlotGroup;
  role: FileRole;
  label: string;
  hint: string;
  required: boolean;
  instituto?: string;
};

export const CONVENIAR_SLOTS: FileSlot[] = [
  ...INSTITUTOS_CONVENIAR.map((instituto) => ({
    id: instituto.toLowerCase(),
    group: "conveniar" as const,
    role: "conveniar" as const,
    label: instituto,
    hint: `${instituto}_LancamentosGestorFinanceiro.xlsx`,
    required: false,
    instituto,
  })),
  {
    id: "equipe",
    group: "conveniar",
    role: "equipe",
    label: "Docentes e equipe",
    hint: "Docentes e Equipe.xlsx",
    required: false,
  },
];

export const BASE_SLOTS: FileSlot[] = [
  {
    id: "sistema",
    group: "bases",
    role: "sistema",
    label: "Matriculados do sistema",
    hint: "matriculados_sistema.xlsx",
    required: true,
  },
  {
    id: "inscritos",
    group: "bases",
    role: "inscritos",
    label: "Inscrições geral",
    hint: "inscricoes-geral.csv",
    required: true,
  },
  {
    id: "planilha_cpf",
    group: "bases",
    role: "planilha_cpf",
    label: "Planilha CPF antiga",
    hint: "Planilha CPF antiga.xlsx",
    required: true,
  },
  {
    id: "matriculados",
    group: "bases",
    role: "matriculados",
    label: "Matriculados",
    hint: "Matriculados.xlsx (aba Matrículas Consolidadas)",
    required: true,
  },
];

export const FILE_SLOTS: FileSlot[] = [...CONVENIAR_SLOTS, ...BASE_SLOTS];

export function slotById(id: string | undefined): FileSlot | undefined {
  if (!id) return undefined;
  return FILE_SLOTS.find((slot) => slot.id === id);
}

export function slotFileMismatch(
  slot: FileSlot,
  filename: string,
): string | null {
  const classified = classifyByName(filename);
  if (classified.role === "unknown") return null;
  if (classified.role !== slot.role) {
    return `${filename} parece ser ${roleLabel(classified)}, e este espaço é ${slot.label}.`;
  }
  if (
    slot.instituto &&
    classified.instituto &&
    classified.instituto !== slot.instituto
  ) {
    return `${filename} parece do ${classified.instituto}, e este espaço é ${slot.instituto}.`;
  }
  return null;
}

export function missingSlots(files: { slotId?: string }[]): string[] {
  const filled = new Set(
    files.map((file) => file.slotId).filter((id): id is string => Boolean(id)),
  );
  const missing: string[] = [];
  if (
    !CONVENIAR_SLOTS.some(
      (slot) => slot.role === "conveniar" && filled.has(slot.id),
    )
  ) {
    missing.push("extrato Conveniar (pelo menos um IF)");
  }
  for (const slot of BASE_SLOTS) {
    if (slot.required && !filled.has(slot.id)) missing.push(slot.label);
  }
  return missing;
}
