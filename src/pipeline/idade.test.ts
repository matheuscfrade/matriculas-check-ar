import { describe, expect, it } from "vitest";
import { calcularIdade, faixaEtaria } from "./idade";

const agora = new Date(2026, 5, 15);

describe("calcularIdade", () => {
  it("calcula idade em anos completos", () => {
    expect(calcularIdade("15/06/1996", agora)).toBe(30);
    expect(calcularIdade("16/06/1996", agora)).toBe(29);
  });

  it("devolve 99 se a data for inválida", () => {
    expect(calcularIdade("32/13/1990", agora)).toBe(99);
  });
});

describe("faixaEtaria", () => {
  it("agrupa faixas do notebook", () => {
    expect(faixaEtaria(17)).toBe("Não Informado ou erro de declaração");
    expect(faixaEtaria(18)).toBe("18 a 29");
    expect(faixaEtaria(35)).toBe("30 a 39");
    expect(faixaEtaria(70)).toBe("70 e mais");
    expect(faixaEtaria(99)).toBe("Não Informado ou erro de declaração");
  });
});
