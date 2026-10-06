import { describe, expect, it } from "vitest";
import { MAX_FILES } from "./accept";
import {
  addFiles,
  clearFiles,
  removeFile,
  setSlotFile,
  type FileHandle,
} from "./store";

function makeFile(name: string, size = 32): File {
  return new File([new Uint8Array(size)], name, {
    type: "application/octet-stream",
  });
}

describe("addFiles", () => {
  it("adiciona planilhas válidas e guarda o File em memória", () => {
    const incoming = [makeFile("a.xlsx"), makeFile("b.csv")];
    let n = 0;
    const { next, errors } = addFiles([], incoming, {
      idFactory: () => `id-${++n}`,
    });

    expect(errors).toEqual([]);
    expect(next).toHaveLength(2);
    expect(next[0]?.name).toBe("a.xlsx");
    expect(next[0]?.file).toBe(incoming[0]);
    expect(next[1]?.name).toBe("b.csv");
  });

  it("não adiciona arquivo recusado e devolve o motivo", () => {
    const { next, errors } = addFiles([], [makeFile("edital.pdf")]);

    expect(next).toEqual([]);
    expect(errors).toEqual([{ name: "edital.pdf", reason: "type" }]);
  });

  it("aceita válidos e recusa inválidos no mesmo lote", () => {
    const { next, errors } = addFiles(
      [],
      [makeFile("ok.xlsx"), makeFile("foto.png"), makeFile("ok.csv")],
    );

    expect(next.map((h) => h.name)).toEqual(["ok.xlsx", "ok.csv"]);
    expect(errors).toEqual([{ name: "foto.png", reason: "type" }]);
  });

  it("respeita o teto de 30 arquivos, aceitando os que cabem", () => {
    const current: FileHandle[] = Array.from({ length: MAX_FILES - 1 }, (_, i) => ({
      id: `c${i}`,
      name: `c${i}.csv`,
      size: 10,
      type: "",
      file: makeFile(`c${i}.csv`, 10),
    }));

    const { next, errors } = addFiles(current, [
      makeFile("cabe.xlsx"),
      makeFile("estoura.xlsx"),
    ]);

    expect(next).toHaveLength(MAX_FILES);
    expect(next.at(-1)?.name).toBe("cabe.xlsx");
    expect(errors).toEqual([{ name: "estoura.xlsx", reason: "count" }]);
  });
});

describe("setSlotFile", () => {
  it("coloca um arquivo no espaço e substitui se já houver", () => {
    const first = makeFile("IFPE_LancamentosGestorFinanceiro.xlsx");
    const second = makeFile("IFPE_LancamentosGestorFinanceiro (1).xlsx");
    const { next: one } = setSlotFile([], "ifpe", first, {
      idFactory: () => "a",
    });
    const { next: two, errors } = setSlotFile(one, "ifpe", second, {
      idFactory: () => "b",
    });

    expect(errors).toEqual([]);
    expect(two).toHaveLength(1);
    expect(two[0]?.slotId).toBe("ifpe");
    expect(two[0]?.name).toBe("IFPE_LancamentosGestorFinanceiro (1).xlsx");
  });

  it("recusa extrato de outro IF e mantém o arquivo anterior", () => {
    const { next: one } = setSlotFile(
      [],
      "ifpe",
      makeFile("IFPE_LancamentosGestorFinanceiro.xlsx"),
      { idFactory: () => "a" },
    );
    const { next, errors } = setSlotFile(
      one,
      "ifpe",
      makeFile("IFES_LancamentosGestorFinanceiro.xlsx"),
    );

    expect(next).toEqual(one);
    expect(errors[0]?.reason).toBe("slot");
  });
});

describe("removeFile e clearFiles", () => {
  it("remove um arquivo pelo id", () => {
    const { next: two } = addFiles([], [makeFile("a.csv"), makeFile("b.csv")], {
      idFactory: (() => {
        let n = 0;
        return () => `id-${++n}`;
      })(),
    });

    const after = removeFile(two, "id-1");
    expect(after.map((h) => h.id)).toEqual(["id-2"]);
  });

  it("esvazia a sessão", () => {
    const { next } = addFiles([], [makeFile("a.csv")]);
    expect(clearFiles()).toEqual([]);
    expect(next).toHaveLength(1);
  });
});
