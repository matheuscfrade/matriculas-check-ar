import { describe, expect, it } from "vitest";
import { processConveniar } from "./conveniar";

describe("processConveniar", () => {
  it("une institutos, formata CPF, extrai curso, exclui equipe e soma duplicatas", () => {
    const result = processConveniar(
      [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "12345678901",
              Favorecido: "Ana",
              Histórico: "bolsa;Caldeireiro;maio",
              Valor: 660,
            },
            {
              "CPF/CNPJ": "12345678901",
              Favorecido: "Ana",
              Histórico: "bolsa;Caldeireiro;junho",
              Valor: 660,
            },
            {
              "CPF/CNPJ": "99999999999",
              Favorecido: "Docente",
              Histórico: "bolsa;Equipe;maio",
              Valor: 1950,
            },
          ],
        },
      ],
      [{ CPF: "999.999.999-99" }],
    );

    expect(result).toEqual([
      {
        CPF: "123.456.789-01",
        Nome: "Ana",
        Instituto: "IFPE",
        Descrição: "Caldeireiro",
        "Valor pago": 1320,
      },
    ]);
  });

  it("ignora IFSUL, que o notebook não lê", () => {
    const result = processConveniar(
      [
        {
          instituto: "IFSUL",
          rows: [
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Sul",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "22222222222",
              Favorecido: "Pe",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      [],
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.Instituto).toBe("IFPE");
  });

  it("arredonda a soma de Valor pago em 2 casas, como o Excel do notebook", () => {
    const result = processConveniar(
      [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "12345678901",
              Favorecido: "Ana",
              Histórico: "bolsa;Curso;maio",
              Valor: 0.1,
            },
            {
              "CPF/CNPJ": "12345678901",
              Favorecido: "Ana",
              Histórico: "bolsa;Curso;junho",
              Valor: 0.2,
            },
          ],
        },
      ],
      [],
    );

    expect(result[0]?.["Valor pago"]).toBe(0.3);
  });
});
