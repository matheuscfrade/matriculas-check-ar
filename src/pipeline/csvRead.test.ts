import { describe, expect, it } from "vitest";
import { readCsv } from "./csvRead";

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("readCsv", () => {
  it("lê cabeçalho e linhas com vírgula", () => {
    const { headers, rows } = readCsv(utf8("CPF,Nome\n11111111111,Ana\n"));
    expect(headers).toEqual(["CPF", "Nome"]);
    expect(rows).toEqual([{ CPF: "11111111111", Nome: "Ana" }]);
  });

  it("lê CSV brasileiro com ponto e vírgula", () => {
    const { rows } = readCsv(utf8("CPF;Nome\n11111111111;Ana"));
    expect(rows[0]).toEqual({ CPF: "11111111111", Nome: "Ana" });
  });

  it("mantém vírgula dentro de aspas", () => {
    const { rows } = readCsv(utf8('Nome,Cidade\n"Silva, Ana",Recife\n'));
    expect(rows[0]?.Nome).toBe("Silva, Ana");
    expect(rows[0]?.Cidade).toBe("Recife");
  });
});
