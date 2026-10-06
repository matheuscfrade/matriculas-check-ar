import { describe, expect, it } from "vitest";
import {
  CONVENIAR_SLOTS,
  missingSlots,
  slotById,
  slotFileMismatch,
} from "./slots";

describe("slots Conveniar", () => {
  it("tem um espaço por IF do notebook", () => {
    expect(
      CONVENIAR_SLOTS.filter((slot) => slot.instituto).map(
        (slot) => slot.instituto,
      ),
    ).toEqual(["IFES", "IFF", "IFMG", "IFPE", "IFPR", "IFSP", "IFSUL"]);
    expect(CONVENIAR_SLOTS.at(-1)?.id).toBe("equipe");
  });
});

describe("slotFileMismatch", () => {
  it("aceita nome desconhecido no espaço do IF", () => {
    expect(
      slotFileMismatch(slotById("ifpe")!, "pagamentos-setembro.xlsx"),
    ).toBeNull();
  });

  it("recusa extrato de outro IF", () => {
    expect(
      slotFileMismatch(
        slotById("ifpe")!,
        "IFES_LancamentosGestorFinanceiro.xlsx",
      ),
    ).toMatch(/IFES/);
  });

  it("recusa planilha de outro papel", () => {
    expect(
      slotFileMismatch(slotById("sistema")!, "Matriculados.xlsx"),
    ).toMatch(/Matriculados/);
  });
});

describe("missingSlots", () => {
  it("pede um Conveniar e as bases obrigatórias", () => {
    expect(missingSlots([])).toEqual([
      "extrato Conveniar (pelo menos um IF)",
      "Matriculados do sistema",
      "Inscrições geral",
      "Planilha CPF antiga",
      "Matriculados",
    ]);
  });

  it("não libera o cruzamento só com docentes e equipe", () => {
    expect(missingSlots([{ slotId: "equipe" }])).toContain(
      "extrato Conveniar (pelo menos um IF)",
    );
  });

  it("libera o cruzamento com um IF e as bases", () => {
    expect(
      missingSlots([
        { slotId: "ifpe" },
        { slotId: "sistema" },
        { slotId: "inscritos" },
        { slotId: "planilha_cpf" },
        { slotId: "matriculados" },
      ]),
    ).toEqual([]);
  });
});
