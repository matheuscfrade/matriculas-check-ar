import { describe, expect, it } from "vitest";
import { formatOutputCell } from "./formatOutput";

describe("formatOutputCell", () => {
  it("formata CPF com máscara e deixa vazio se não houver dígitos", () => {
    expect(formatOutputCell("CPF", "11111111111")).toBe("111.111.111-11");
    expect(formatOutputCell("CPF", 1111111111)).toBe("011.111.111-11");
    expect(formatOutputCell("CPF", "")).toBe("");
    expect(formatOutputCell("CPF", undefined)).toBe("");
  });

  it("grava data em DD/MM/YYYY a partir de serial, Date ou texto", () => {
    expect(formatOutputCell("DATA DE NASCIMENTO", 32947)).toBe("15/03/1990");
    expect(formatOutputCell("DATA DE NASCIMENTO", new Date(1990, 2, 15))).toBe(
      "15/03/1990",
    );
    expect(formatOutputCell("DATA DE NASCIMENTO", "1990-03-15")).toBe(
      "15/03/1990",
    );
    expect(formatOutputCell("INÍCIO CICLO", "Não informado")).toBe(
      "Não informado",
    );
  });

  it("mantém texto como texto e número nas colunas numéricas", () => {
    expect(formatOutputCell("NOME COMPLETO", "ANA CRISTINA")).toBe(
      "ANA CRISTINA",
    );
    expect(formatOutputCell("EDITAL", "103/2025")).toBe("103/2025");
    expect(formatOutputCell("N° INSCRIÇÃO", "2501100173")).toBe(2501100173);
    expect(formatOutputCell("VALOR RECEBIDO", 660)).toBe(660);
    expect(formatOutputCell("VALOR RECEBIDO", "Não informado")).toBe(
      "Não informado",
    );
    expect(formatOutputCell("BOLSA", "Conferir")).toBe("Conferir");
    expect(formatOutputCell("Valor pago", "1320,5")).toBe(1320.5);
    expect(formatOutputCell("VALOR RECEBIDO", 3117.5299999999997)).toBe(3117.53);
  });

  it("prefixa texto que o Excel trataria como fórmula", () => {
    expect(
      formatOutputCell("NOME COMPLETO", '=HYPERLINK("http://127.0.0.1","x")'),
    ).toBe(`'=HYPERLINK("http://127.0.0.1","x")`);
    expect(formatOutputCell("CURSO", "+cmd")).toBe("'+cmd");
    expect(formatOutputCell("BAIRRO", "@SUM(1)")).toBe("'@SUM(1)");
  });
});
