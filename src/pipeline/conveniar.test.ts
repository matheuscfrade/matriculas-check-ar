import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { processConveniar } from "./conveniar";
import { readSheet } from "./io";

const CONSULTA_UNIFICADA = resolve(
  "1791314573_ConsultaLancamentos.xlsx",
);

describe("processConveniar", () => {
  it("une institutos, formata CPF, extrai curso e soma duplicatas", () => {
    const result = processConveniar([
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
        ],
      },
    ]);

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

  it("lê o extrato do IFSUL junto com os demais IFs", () => {
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
    );

    expect(result.map((row) => row.Instituto)).toEqual(["IFSUL", "IFPE"]);
  });

  it("lê a consulta unificada: instituto no Projeto, nome em Empresa / Pessoa / Projeto e CPF com ou sem máscara", () => {
    const result = processConveniar(
      [
        {
          instituto: "DESCONHECIDO",
          rows: [
            {
              "CPF/CNPJ": "09792500480",
              "Empresa / Pessoa / Projeto": "Ana",
              Histórico: "Pgto. Bolsa para Ana, ref. ;CALDEIREIRO;COMP.09/26",
              Valor: 660,
              "Valor Pago": 660,
              Projeto: "Projeto Autonomia e Renda - IFPE",
            },
            {
              "CPF/CNPJ": "708.110.722-23",
              "Empresa / Pessoa / Projeto": "Bia",
              Histórico: "Pgto. Bolsa para Bia, ref. ;SOLDADOR;COMP.10/26",
              Valor: 858,
              "Valor Pago": 858,
              Projeto: "Projeto Autonomia e Renda - IFSUL",
            },
          ],
        },
      ],
    );

    expect(result).toEqual([
      {
        CPF: "097.925.004-80",
        Nome: "Ana",
        Instituto: "IFPE",
        Descrição: "CALDEIREIRO",
        "Valor pago": 660,
      },
      {
        CPF: "708.110.722-23",
        Nome: "Bia",
        Instituto: "IFSUL",
        Descrição: "SOLDADOR",
        "Valor pago": 858,
      },
    ]);
  });

  it("usa Valor Pago da consulta unificada quando Valor é diferente", () => {
    const result = processConveniar(
      [
        {
          instituto: "DESCONHECIDO",
          rows: [
            {
              "CPF/CNPJ": "12345678901",
              "Empresa / Pessoa / Projeto": "Ana",
              Histórico: "x;Curso;y",
              Valor: 1000,
              "Valor Pago": 660,
              Projeto: "Projeto Autonomia e Renda - IFPE",
            },
          ],
        },
      ],
    );

    expect(result[0]?.["Valor pago"]).toBe(660);
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
    );

    expect(result[0]?.["Valor pago"]).toBe(0.3);
  });

  it.skipIf(!existsSync(CONSULTA_UNIFICADA))(
    "lê a ConsultaLancamentos real e reparte os IFs pela coluna Projeto",
    () => {
      const { headers, rows } = readSheet(readFileSync(CONSULTA_UNIFICADA));
      expect(headers).toContain("CPF/CNPJ");
      expect(headers).toContain("Empresa / Pessoa / Projeto");
      expect(headers).toContain("Valor Pago");
      expect(headers).toContain("Projeto");

      const result = processConveniar([{ instituto: "DESCONHECIDO", rows }]);

      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((row) => row.Instituto))).toEqual(
        new Set(["IFES", "IFF", "IFPE", "IFPR", "IFSP", "IFSUL"]),
      );
      expect(result.every((row) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(String(row.CPF)))).toBe(
        true,
      );
    },
  );
});
