import { describe, expect, it } from "vitest";
import { cruzarFaltantes, processInscritos } from "./inscritos";

describe("processInscritos", () => {
  it("extrai edital, formata CPF e troca o nome do instituto", () => {
    const [row] = processInscritos([
      {
        EDITAL: "Edital n° 151/2026",
        "NÚMERO DE INSCRIÇÃO": 2615101280,
        CPF: "11111111111",
        "NOME CIVIL": "Nova Pessoa",
        INSTITUTO: "Instituto Federal de Pernambuco",
        CURSO: "Caldeireiro",
        TURNO: "Noite",
      },
    ]);

    expect(row).toEqual({
      EDITAL: "151/2026",
      "NÚMERO DE INSCRIÇÃO": 2615101280,
      CPF: "111.111.111-11",
      "NOME CIVIL": "Nova Pessoa",
      INSTITUTO: "IFPE",
      CURSO: "Caldeireiro",
      TURNO: "Noite",
    });
  });
});

describe("cruzarFaltantes", () => {
  const falta = {
    CPF: "111.111.111-11",
    Nome: "Só no Conveniar",
    Instituto: "IFPE",
    Descrição: "Soldagem",
    "Valor pago": 660,
  };

  it("preenche colunas de inscrição com Não encontrado quando o CPF não está nas inscrições", () => {
    const [row] = cruzarFaltantes([falta], []);
    expect(row?.CPF).toBe("111.111.111-11");
    expect(row?.EDITAL_INSCRIÇÃO).toBe("Não encontrado");
    expect(row?.["NÚMERO DE INSCRIÇÃO_INSCRIÇÃO"]).toBe("Não encontrado");
    expect(row?.Nome).toBe("Só no Conveniar");
    expect(Object.keys(row ?? {})[0]).toBe("CPF");
  });

  it("traz possíveis IDs e editais quando o CPF aparece nas inscrições", () => {
    const rows = cruzarFaltantes(
      [falta],
      processInscritos([
        {
          EDITAL: "Edital n° 151/2026",
          "NÚMERO DE INSCRIÇÃO": 1,
          CPF: "11111111111",
          "NOME CIVIL": "Só no Conveniar",
          INSTITUTO: "Instituto Federal de Pernambuco",
          CURSO: "Soldagem",
          TURNO: "Tarde",
        },
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 2,
          CPF: "11111111111",
          "NOME CIVIL": "Só no Conveniar",
          INSTITUTO: "Instituto Federal de Pernambuco",
          CURSO: "Caldeireiro",
          TURNO: "Noite",
        },
      ]),
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row["NÚMERO DE INSCRIÇÃO_INSCRIÇÃO"])).toEqual([
      1, 2,
    ]);
    expect(rows[0]?.EDITAL_INSCRIÇÃO).toBe("151/2026");
  });
});
