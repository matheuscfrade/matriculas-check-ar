import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("mantém DD/MM/YYYY", () => {
    expect(formatDate("15/03/1990")).toBe("15/03/1990");
  });

  it("converte ISO para DD/MM/YYYY", () => {
    expect(formatDate("1990-03-15")).toBe("15/03/1990");
    expect(formatDate("1990-03-15 00:00:00")).toBe("15/03/1990");
  });

  it("interpreta Date do Excel", () => {
    expect(formatDate(new Date(1990, 2, 15))).toBe("15/03/1990");
  });

  it("interpreta serial numérico do Excel", () => {
    expect(formatDate(32947)).toBe("15/03/1990");
    expect(formatDate(32946.99967592592)).toBe("15/03/1990");
  });

  it("devolve o original se não reconhecer", () => {
    expect(formatDate("nascimento")).toBe("nascimento");
  });
});
