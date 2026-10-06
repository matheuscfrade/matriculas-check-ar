import { describe, expect, it } from "vitest";
import { PLANILHA_CPF_COLS, toPlanilhaCpfRow } from "./planilhaCols";

describe("PLANILHA_CPF_COLS", () => {
  it("coloca desistência imediatamente antes de OBSERVAÇÃO", () => {
    const last = PLANILHA_CPF_COLS.slice(-4);
    expect(last).toEqual([
      "QUANTIDADE",
      "DESISTIU?",
      "DATA DA DESISTÊNCIA",
      "OBSERVAÇÃO",
    ]);
  });
});

describe("toPlanilhaCpfRow", () => {
  it("preserva DESISTIU? e DATA DA DESISTÊNCIA", () => {
    const row = toPlanilhaCpfRow({
      EDITAL: "103/2025",
      "DESISTIU?": "NÃO",
      "DATA DA DESISTÊNCIA": "10/02/2026",
      OBSERVAÇÃO: "OK",
    });
    expect(row["DESISTIU?"]).toBe("NÃO");
    expect(row["DATA DA DESISTÊNCIA"]).toBe("10/02/2026");
    expect(row.OBSERVAÇÃO).toBe("OK");
  });

  it("arredonda VALOR RECEBIDO em 2 casas para bater com o Excel", () => {
    const row = toPlanilhaCpfRow({
      "VALOR RECEBIDO": 3117.5299999999997,
    });
    expect(row["VALOR RECEBIDO"]).toBe(3117.53);
  });
});
