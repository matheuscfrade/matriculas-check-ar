import { describe, expect, it } from "vitest";
import {
  classifyByHeaders,
  classifyByName,
  classifyFile,
  missingRequiredRoles,
  roleFitsSlot,
} from "./classify";

describe("classifyByName", () => {
  it("reconhece extratos do Conveniar pelo nome do arquivo", () => {
    expect(classifyByName("IFPE_LancamentosGestorFinanceiro.xlsx")).toEqual({
      role: "conveniar",
      instituto: "IFPE",
    });
    expect(classifyByName("IFSP-LancamentosGestorFinanceiro.xlsx")).toEqual({
      role: "conveniar",
      instituto: "IFSP",
    });
  });

  it("reconhece equipe, sistema, inscrições e Planilha CPF", () => {
    expect(classifyByName("Docentes e Equipe.xlsx").role).toBe("equipe");
    expect(classifyByName("matriculados_sistema.xlsx").role).toBe("sistema");
    expect(classifyByName("inscricoes-geral.csv").role).toBe("inscritos");
    expect(classifyByName("Planilha CPF antiga.xlsx").role).toBe("planilha_cpf");
  });

  it("reconhece a planilha Matriculados sem confundir com o sistema", () => {
    expect(classifyByName("Matriculados.xlsx").role).toBe("matriculados");
    expect(classifyByName("Matrículas Consolidadas.csv").role).toBe(
      "matriculados",
    );
    expect(classifyByName("matriculados_sistema (1).xlsx").role).toBe("sistema");
  });
});

describe("missingRequiredRoles", () => {
  it("exige Matriculados além de Conveniar, sistema e Planilha CPF", () => {
    expect(
      missingRequiredRoles([
        "IFPE_LancamentosGestorFinanceiro.xlsx",
        "Docentes e Equipe.xlsx",
        "matriculados_sistema.xlsx",
        "inscricoes-geral.csv",
        "Planilha CPF antiga.xlsx",
      ]),
    ).toEqual(["Matriculados (aba Matrículas Consolidadas)"]);
    expect(
      missingRequiredRoles([
        "IFPE_LancamentosGestorFinanceiro.xlsx",
        "matriculados_sistema.xlsx",
        "inscricoes-geral.csv",
        "Planilha CPF antiga.xlsx",
        "Matriculados.xlsx",
      ]),
    ).toEqual([]);
  });

  it("exige inscricoes-geral além das outras bases", () => {
    expect(
      missingRequiredRoles([
        "IFPE_LancamentosGestorFinanceiro.xlsx",
        "matriculados_sistema.xlsx",
        "Planilha CPF antiga.xlsx",
        "Matriculados.xlsx",
      ]),
    ).toEqual(["inscricoes-geral"]);
  });
});

describe("classifyByHeaders", () => {
  it("reconhece Matriculados pelas colunas Edital, ID e CPF", () => {
    expect(
      classifyByHeaders(["Edital", "ID", "Nome", "CPF", "Status"]),
    ).toBe("matriculados");
  });

  it("reconhece inscrições geral pela coluna TURNO", () => {
    expect(
      classifyByHeaders([
        "EDITAL",
        "NÚMERO DE INSCRIÇÃO",
        "CPF",
        "NOME CIVIL",
        "TURNO",
      ]),
    ).toBe("inscritos");
  });

  it("mantém matriculados_sistema mesmo quando também tem TURNO", () => {
    expect(
      classifyByHeaders([
        "EDITAL",
        "NÚMERO DE INSCRIÇÃO",
        "NOME CIVIL",
        "CPF",
        "TURNO",
        "CATEGORIA DO CURSO",
        "CIDADE DO CAMPUS",
        "DATA DE NASCIMENTO",
      ]),
    ).toBe("sistema");
  });
});

describe("roleFitsSlot", () => {
  it("aceita sistema e inscrições geral um no espaço do outro", () => {
    expect(roleFitsSlot("sistema", "inscritos")).toBe(true);
    expect(roleFitsSlot("inscritos", "sistema")).toBe(true);
  });

  it("recusa extrato Conveniar no espaço do sistema", () => {
    expect(roleFitsSlot("sistema", "conveniar")).toBe(false);
  });
});

describe("classifyFile", () => {
  it("não trata extrato Conveniar pelo nome quando os cabeçalhos são de equipe", () => {
    expect(classifyFile("IFPE_Lancamentos.xlsx", ["CPF"]).role).toBe("unknown");
  });

  it("mantém Conveniar quando nome e cabeçalhos batem", () => {
    expect(
      classifyFile("IFPE_LancamentosGestorFinanceiro.xlsx", [
        "CPF/CNPJ",
        "Favorecido",
        "Valor",
      ]),
    ).toEqual({ role: "conveniar", instituto: "IFPE" });
  });
});
