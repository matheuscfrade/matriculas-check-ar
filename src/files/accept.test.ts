import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, MAX_FILES, evaluateFile } from "./accept";

function fileLike(name: string, size: number) {
  return { name, size };
}

describe("evaluateFile", () => {
  it("aceita .xlsx", () => {
    expect(evaluateFile(fileLike("controle.xlsx", 1024))).toEqual({ ok: true });
  });

  it("aceita extensão em maiúsculas", () => {
    expect(evaluateFile(fileLike("INSCRICOES.CSV", 2048))).toEqual({ ok: true });
  });

  it("aceita .csv e recusa .xls", () => {
    expect(evaluateFile(fileLike("b.csv", 10))).toEqual({ ok: true });
    expect(evaluateFile(fileLike("a.xls", 10))).toEqual({
      ok: false,
      reason: "type",
    });
  });

  it("recusa tipo que não é planilha", () => {
    expect(evaluateFile(fileLike("edital.pdf", 1024))).toEqual({
      ok: false,
      reason: "type",
    });
  });

  it("recusa arquivo sem extensão", () => {
    expect(evaluateFile(fileLike("planilha", 1024))).toEqual({
      ok: false,
      reason: "type",
    });
  });

  it("aceita CSV de 77 MB", () => {
    expect(
      evaluateFile(fileLike("inscricoes-geral.csv", 77 * 1024 * 1024)),
    ).toEqual({ ok: true });
  });

  it("recusa arquivo maior que 150 MB", () => {
    expect(evaluateFile(fileLike("grande.xlsx", MAX_FILE_BYTES + 1))).toEqual({
      ok: false,
      reason: "size",
    });
  });

  it("aceita arquivo com exatamente 150 MB", () => {
    expect(evaluateFile(fileLike("limite.xlsx", MAX_FILE_BYTES))).toEqual({
      ok: true,
    });
  });

  it("recusa quando a sessão já está no teto de arquivos", () => {
    expect(
      evaluateFile(fileLike("mais.csv", 10), { currentCount: MAX_FILES }),
    ).toEqual({ ok: false, reason: "count" });
  });

  it("aceita quando ainda cabe mais um", () => {
    expect(
      evaluateFile(fileLike("mais.csv", 10), { currentCount: MAX_FILES - 1 }),
    ).toEqual({ ok: true });
  });
});
