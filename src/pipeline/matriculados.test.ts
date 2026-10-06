import { describe, expect, it } from "vitest";
import {
  cpfsDosEditais,
  idsFinalizados,
  infoFinalizados,
  semCpfs,
  situacaoMatriculaFinal,
  statusFinalDoMotivo,
} from "./matriculados";

describe("cpfsDosEditais", () => {
  it("devolve CPFs formatados só dos editais 2024 listados no notebook", () => {
    const cpfs = cpfsDosEditais([
      { Edital: "075/2024", CPF: "444.444.444-44" },
      { Edital: "151/2026", CPF: "555.555.555-55" },
      { Edital: "141/2024", CPF: "11111111111" },
    ]);
    expect(cpfs).toEqual(["444.444.444-44", "111.111.111-11"]);
  });

  it("preserva CPF de 2024 que também aparece em edital posterior", () => {
    const cpfs = cpfsDosEditais([
      { Edital: "075/2024", CPF: "444.444.444-44" },
      { Edital: "151/2026", CPF: "444.444.444-44" },
      { Edital: "141/2024", CPF: "11111111111" },
    ]);
    expect(cpfs).toEqual(["111.111.111-11"]);
  });
});

describe("semCpfs", () => {
  it("remove de institutos os CPFs dos editais 2024", () => {
    const rest = semCpfs(
      [
        { CPF: "444.444.444-44", Nome: "Aline", Instituto: "IFSP" },
        { CPF: "222.222.222-22", Nome: "Atual", Instituto: "IFPE" },
      ],
      ["444.444.444-44"],
    );
    expect(rest).toHaveLength(1);
    expect(rest[0]?.Nome).toBe("Atual");
  });
});

describe("idsFinalizados", () => {
  it("coleta IDs com Status Finalizado como string", () => {
    const ids = idsFinalizados([
      { ID: 2409200036, Status: "Finalizado" },
      { ID: 2615101280, Status: "Cursando" },
    ]);
    expect(ids.has("2409200036")).toBe(true);
    expect(ids.has("2615101280")).toBe(false);
  });
});

describe("infoFinalizados", () => {
  it("traz situação de matrícula e motivo dos IDs finalizados", () => {
    const info = infoFinalizados([
      {
        ID: 2409200036,
        Status: "Finalizado",
        "Situação de matrícula": "Concluído",
        Motivo: "Aprovado",
      },
      {
        ID: 1,
        Status: "Cursando",
        "Situação de matrícula": "Cursando",
        Motivo: "",
      },
    ]);
    expect(info.get("2409200036")).toEqual({
      situacaoMatricula: "Concluído",
      motivo: "Aprovado",
    });
    expect(info.has("1")).toBe(false);
  });
});

describe("normalização de finalizados", () => {
  it("padroniza situação de matrícula e motivo conhecidos", () => {
    expect(situacaoMatriculaFinal("Concluído")).toBe("CONCLUIDO");
    expect(situacaoMatriculaFinal("Evasão")).toBe("EVASÃO");
    expect(situacaoMatriculaFinal("Cancelada")).toBe("CANCELADO");
    expect(situacaoMatriculaFinal("Outro")).toBe("");
    expect(statusFinalDoMotivo("Aprovado")).toBe("APROVADO");
    expect(statusFinalDoMotivo("Reprovado")).toBe("REPROVADO");
    expect(statusFinalDoMotivo("Evasão por infrequência")).toBe(
      "Evasão por infrequência",
    );
    expect(statusFinalDoMotivo("  ")).toBe("");
  });
});
