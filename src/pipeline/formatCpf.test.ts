import { describe, expect, it } from "vitest";
import { formatarCpf } from "./formatCpf";

describe("formatarCpf", () => {
  it("formata 11 dígitos com pontos e hífen", () => {
    expect(formatarCpf("12345678901")).toBe("123.456.789-01");
  });

  it("completa com zeros à esquerda", () => {
    expect(formatarCpf("123456789")).toBe("001.234.567-89");
  });

  it("remove pontuação já existente", () => {
    expect(formatarCpf("123.456.789-01")).toBe("123.456.789-01");
  });

  it("aceita número vindo do Excel", () => {
    expect(formatarCpf(12345678901)).toBe("123.456.789-01");
  });

  it("devolve só os dígitos se passar de 11", () => {
    expect(formatarCpf("123456789012")).toBe("123456789012");
  });
});
