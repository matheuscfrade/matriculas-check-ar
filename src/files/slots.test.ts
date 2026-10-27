import { describe, expect, it } from "vitest";
import {
  CONVENIAR_SLOTS,
  missingSlots,
  slotById,
  slotFileMismatch,
} from "./slots";

describe("slots Conveniar", () => {
  it("tem só o espaço da consulta unificada", () => {
    expect(CONVENIAR_SLOTS.map((slot) => slot.id)).toEqual(["conveniar"]);
  });
});

describe("slotFileMismatch", () => {
  it("aceita a consulta unificada e o extrato antigo por IF no mesmo espaço", () => {
    expect(
      slotFileMismatch(slotById("conveniar")!, "ConsultaLancamentos.xlsx"),
    ).toBeNull();
    expect(
      slotFileMismatch(
        slotById("conveniar")!,
        "IFPE_LancamentosGestorFinanceiro.xlsx",
      ),
    ).toBeNull();
  });

  it("recusa planilha de outro papel", () => {
    expect(
      slotFileMismatch(slotById("sistema")!, "Matriculados.xlsx"),
    ).toMatch(/Matriculados/);
  });

  it("recusa docentes e equipe no espaço da consulta", () => {
    expect(
      slotFileMismatch(slotById("conveniar")!, "Docentes e Equipe.xlsx"),
    ).toMatch(/Docentes e equipe/);
  });
});

describe("missingSlots", () => {
  it("pede um Conveniar e as bases obrigatórias", () => {
    expect(missingSlots([])).toEqual([
      "Consulta de lançamentos Conveniar",
      "Matriculados do sistema",
      "Inscrições geral",
      "Planilha CPF antiga",
      "Matriculados",
    ]);
  });

  it("libera o cruzamento com a consulta unificada e as bases", () => {
    expect(
      missingSlots([
        { slotId: "conveniar" },
        { slotId: "sistema" },
        { slotId: "inscritos" },
        { slotId: "planilha_cpf" },
        { slotId: "matriculados" },
      ]),
    ).toEqual([]);
  });
});
