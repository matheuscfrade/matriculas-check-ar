import { describe, expect, it } from "vitest";
import { processSistema } from "./sistema";

const agora = new Date(2026, 5, 15);

describe("processSistema", () => {
  it("monta as colunas da Planilha CPF e ajusta faixa de renda FIC", () => {
    const [row] = processSistema(
      [
        {
          EDITAL: "Edital n° 103/2025/A&R",
          "NÚMERO DE INSCRIÇÃO": 42,
          "NOME CIVIL": "Ana Silva",
          CPF: "12345678901",
          "DATA DE NASCIMENTO": "15/03/1996",
          CURSO: "Caldeireiro",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "CADASTRO DE RESERVA",
          "RENDA PER CAPITA": "Acima de três salários mínimos",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
          DESISTÊNCIA: "SIM",
          "DATA DA DESISTÊNCIA": "10/02/2026",
        },
      ],
      agora,
    );

    expect(row?.EDITAL).toBe("103/2025");
    expect(row?.["N° INSCRIÇÃO"]).toBe(42);
    expect(row?.CPF).toBe("123.456.789-01");
    expect(row?.UNIDADE).toBe("IFPE");
    expect(row?.["AÇÃO AFIRMATIVA"]).toBe("CR");
    expect(row?.["FAIXA ETÁRIA"]).toBe("30 a 39");
    expect(row?.["FAIXA RENDA"]).toBe("Até 0,5 S.M.");
    expect(row?.ESCOLARIDADE).toBe("Médio Completo");
    expect(row).not.toHaveProperty("IDADE");
    expect(row).not.toHaveProperty("TIPO");
    expect(row?.["DESISTIU?"]).toBe("SIM");
    expect(row?.["DATA DA DESISTÊNCIA"]).toBe("10/02/2026");
  });
});
