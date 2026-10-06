import { describe, expect, it } from "vitest";
import { runPipeline } from "./run";

const agora = new Date(2026, 5, 15);

describe("runPipeline", () => {
  it("gera Planilha CPF e ausentes a partir do cruzamento", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Nova Aluna",
              Histórico: "x;Caldeireiro;y",
              Valor: 660,
            },
            {
              "CPF/CNPJ": "22222222222",
              Favorecido: "Já na planilha",
              Histórico: "x;Caldeireiro;y",
              Valor: 660,
            },
            {
              "CPF/CNPJ": "33333333333",
              Favorecido: "Só no Conveniar",
              Histórico: "x;Soldagem;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 1,
          "NOME CIVIL": "Nova Aluna",
          CPF: "11111111111",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Caldeireiro",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 2,
          "NOME CIVIL": "Já na planilha",
          CPF: "22222222222",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Caldeireiro",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Masculino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [
        {
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": 2,
          "NOME COMPLETO": "Já na planilha",
          CPF: "222.222.222-22",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 1,
        },
      ],
    });

    expect(result.ausentes).toHaveLength(1);
    expect(result.ausentes[0]?.Nome).toBe("Só no Conveniar");
    expect(result.novos).toHaveLength(1);
    expect(result.novos[0]?.["NOME COMPLETO"]).toBe("Nova Aluna");
    expect(result.novos[0]?.BOLSA).toBe(660);
    expect(result.planilhaCpf).toHaveLength(2);

    const antiga = result.planilhaCpf.find((r) => r.CPF === "222.222.222-22");
    expect(antiga?.["VALOR RECEBIDO"]).toBe(1320);
    expect(antiga?.QUANTIDADE).toBe(2);
    expect(antiga?.OBSERVAÇÃO).toBe("OK");

    const nova = result.planilhaCpf.find((r) => r.CPF === "111.111.111-11");
    expect(nova?.OBSERVAÇÃO).toBe("Novo Registro");
    expect(nova?.["VALOR RECEBIDO"]).toBe(660);
  });

  it("arredonda VALOR RECEBIDO em 2 casas ao somar com o Conveniar", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "22222222222",
              Favorecido: "Já na planilha",
              Histórico: "x;Caldeireiro;y",
              Valor: 0.1,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 2,
          "NOME CIVIL": "Já na planilha",
          CPF: "22222222222",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Caldeireiro",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Masculino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [
        {
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": 2,
          "NOME COMPLETO": "Já na planilha",
          CPF: "222.222.222-22",
          "VALOR RECEBIDO": 0.2,
          QUANTIDADE: 1,
        },
      ],
    });

    const antiga = result.planilhaCpf.find((r) => r.CPF === "222.222.222-22");
    expect(antiga?.["VALOR RECEBIDO"]).toBe(0.3);
  });

  it("marca Sem pagamento quem já estava na planilha e não veio no Conveniar", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Nova",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 1/2025",
          "NÚMERO DE INSCRIÇÃO": 1,
          "NOME CIVIL": "Nova",
          CPF: "11111111111",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [
        {
          CPF: "999.999.999-99",
          "NOME COMPLETO": "Sem bolsa neste mês",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 3,
        },
      ],
    });

    const sem = result.planilhaCpf.find((r) => r.CPF === "999.999.999-99");
    expect(sem?.OBSERVAÇÃO).toBe("Sem pagamento");
    expect(sem?.["VALOR RECEBIDO"]).toBe(660);
    expect(sem?.QUANTIDADE).toBe(3);
  });

  it("não deixa a inscrição 15 virar a primeira coluna da Planilha CPF", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Nova",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 1,
          "NOME CIVIL": "Nova",
          CPF: "11111111111",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [
        {
          "15": 15,
          "NOME COMPLETO": "Antiga",
          CPF: "222.222.222-22",
          EDITAL: "103/2025",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 1,
        },
      ],
    });

    const keys = Object.keys(result.planilhaCpf[0] ?? {});
    expect(keys[0]).toBe("EDITAL");
    expect(keys).not.toContain("15");
    expect(result.planilhaCpf[0]?.EDITAL).toBe("103/2025");
    expect(result.planilhaCpf[0]?.["N° INSCRIÇÃO"]).toBe(15);
  });

  it("tira do Conveniar os CPFs dos editais 2024 da planilha Matriculados", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFSP",
          rows: [
            {
              "CPF/CNPJ": "44444444444",
              Favorecido: "Aline 2024",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Atual",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 1,
          "NOME CIVIL": "Atual",
          CPF: "11111111111",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [],
      matriculados: [
        { Edital: "075/2024", CPF: "444.444.444-44", ID: 2407500492, Status: "Finalizado" },
      ],
    });

    expect(result.resumo.cpfs2024).toBe(1);
    expect(result.resumo.conveniar).toBe(1);
    expect(result.ausentes).toHaveLength(0);
    expect(result.novos[0]?.["NOME COMPLETO"]).toBe("Atual");
  });

  it("marca Curso Finalizado quando o ID está Finalizado e não houve pagamento", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Nova",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 1/2025",
          "NÚMERO DE INSCRIÇÃO": 1,
          "NOME CIVIL": "Nova",
          CPF: "11111111111",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [
        {
          CPF: "999.999.999-99",
          "N° INSCRIÇÃO": 2409200036,
          "NOME COMPLETO": "Concluiu",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 3,
        },
      ],
      matriculados: [
        { Edital: "092/2024", ID: 2409200036, CPF: "999.999.999-99", Status: "Finalizado" },
      ],
    });

    const fim = result.planilhaCpf.find((r) => r.CPF === "999.999.999-99");
    expect(fim?.OBSERVAÇÃO).toBe("Curso Finalizado");
    expect(fim?.["VALOR RECEBIDO"]).toBe(660);
    expect(fim?.QUANTIDADE).toBe(3);
    expect(fim?.["SITUAÇÃO CURSO"]).toBe("FINALIZADO");
  });

  it("traz DESISTIU? da inscrição para a Planilha CPF antiga", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "22222222222",
              Favorecido: "Já na planilha",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 103/2025",
          "NÚMERO DE INSCRIÇÃO": 2,
          "NOME CIVIL": "Já na planilha",
          CPF: "22222222222",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
          DESISTÊNCIA: "SIM",
          "DATA DA DESISTÊNCIA": "10/02/2026",
        },
      ],
      planilhaAntiga: [
        {
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": 2,
          "NOME COMPLETO": "Já na planilha",
          CPF: "222.222.222-22",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 1,
        },
      ],
      matriculados: [],
    });

    const antiga = result.planilhaCpf.find((r) => r.CPF === "222.222.222-22");
    expect(antiga?.["DESISTIU?"]).toBe("SIM");
    expect(antiga?.["DATA DA DESISTÊNCIA"]).toBe("10/02/2026");
    expect(antiga?.OBSERVAÇÃO).toBe("OK");
  });

  it("não tira do Conveniar quem está em edital 2024 e também em edital posterior", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFSP",
          rows: [
            {
              "CPF/CNPJ": "44444444444",
              Favorecido: "Aline voltou",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 151/2026",
          "NÚMERO DE INSCRIÇÃO": 99,
          "NOME CIVIL": "Aline voltou",
          CPF: "44444444444",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de São Paulo (Cubatão)",
          "CIDADE DO CAMPUS": "Cubatão",
          ESTADO: "SP",
          CIDADE: "Cubatão",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [],
      matriculados: [
        { Edital: "075/2024", CPF: "444.444.444-44", ID: 1, Status: "Finalizado" },
        { Edital: "151/2026", CPF: "444.444.444-44", ID: 99, Status: "Cursando" },
      ],
    });

    expect(result.resumo.cpfs2024).toBe(0);
    expect(result.resumo.conveniar).toBe(1);
    expect(result.novos[0]?.["NOME COMPLETO"]).toBe("Aline voltou");
  });

  it("enriquece CPFs ausentes com possíveis IDs e editais das inscrições", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "33333333333",
              Favorecido: "Só no Conveniar",
              Histórico: "x;Soldagem;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [],
      planilhaAntiga: [],
      matriculados: [],
      inscritos: [
        {
          EDITAL: "Edital n° 151/2026",
          "NÚMERO DE INSCRIÇÃO": 2615100001,
          CPF: "33333333333",
          "NOME CIVIL": "Só no Conveniar",
          INSTITUTO: "Instituto Federal de Pernambuco",
          CURSO: "Soldagem",
          TURNO: "Noite",
        },
      ],
    });

    expect(result.resumo.ausentes).toBe(1);
    expect(result.ausentes).toHaveLength(1);
    expect(result.ausentes[0]?.Nome).toBe("Só no Conveniar");
    expect(result.ausentes[0]?.EDITAL_INSCRIÇÃO).toBe("151/2026");
    expect(result.ausentes[0]?.["NÚMERO DE INSCRIÇÃO_INSCRIÇÃO"]).toBe(
      2615100001,
    );
  });

  it("atualiza situação e status final dos IDs já finalizados na Matriculados", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [
        {
          instituto: "IFPE",
          rows: [
            {
              "CPF/CNPJ": "11111111111",
              Favorecido: "Nova",
              Histórico: "x;Curso;y",
              Valor: 660,
            },
          ],
        },
      ],
      equipe: [],
      sistema: [
        {
          EDITAL: "Edital n° 1/2025",
          "NÚMERO DE INSCRIÇÃO": 1,
          "NOME CIVIL": "Nova",
          CPF: "11111111111",
          "DATA DE NASCIMENTO": "01/01/1990",
          CURSO: "Curso",
          INSTITUTO: "Instituto Federal de Pernambuco",
          "CIDADE DO CAMPUS": "Recife",
          ESTADO: "PE",
          CIDADE: "Recife",
          BAIRRO: "Centro",
          SEXO: "Feminino",
          "CONCORRÊNCIA/ AÇÃO AFIRMATIVA": "AC",
          "RENDA PER CAPITA": "Até meio salário mínimo",
          ESCOLARIDADE: "Ensino Médio completo",
          "CATEGORIA DO CURSO": "FIC",
        },
      ],
      planilhaAntiga: [
        {
          CPF: "999.999.999-99",
          "N° INSCRIÇÃO": 2409200036,
          "NOME COMPLETO": "Concluiu",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 3,
          "SITUAÇÃO CURSO": "Não informado",
          "SITUAÇÃO MATRÍCULA": "Não informado",
          "STATUS FINAL": "Cursando",
        },
        {
          CPF: "888.888.888-88",
          "N° INSCRIÇÃO": 2409200999,
          "NOME COMPLETO": "Evadiu",
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 2,
          "STATUS FINAL": "Cursando",
        },
      ],
      matriculados: [
        {
          Edital: "092/2024",
          ID: 2409200036,
          CPF: "999.999.999-99",
          Status: "Finalizado",
          "Situação de matrícula": "Concluído",
          Motivo: "Aprovado",
        },
        {
          Edital: "092/2024",
          ID: 2409200999,
          CPF: "888.888.888-88",
          Status: "Finalizado",
          "Situação de matrícula": "Evasão",
          Motivo: "Infrequência",
        },
      ],
    });

    const aprovado = result.planilhaCpf.find((r) => r.CPF === "999.999.999-99");
    expect(aprovado?.["SITUAÇÃO CURSO"]).toBe("FINALIZADO");
    expect(aprovado?.["SITUAÇÃO MATRÍCULA"]).toBe("CONCLUIDO");
    expect(aprovado?.["STATUS FINAL"]).toBe("APROVADO");
    expect(aprovado?.OBSERVAÇÃO).toBe("Curso Finalizado");

    const evadido = result.planilhaCpf.find((r) => r.CPF === "888.888.888-88");
    expect(evadido?.["SITUAÇÃO CURSO"]).toBe("FINALIZADO");
    expect(evadido?.["SITUAÇÃO MATRÍCULA"]).toBe("EVASÃO");
    expect(evadido?.["STATUS FINAL"]).toBe("Infrequência");
  });

  it("mantém só a primeira linha de cada N° INSCRIÇÃO na Planilha CPF", () => {
    const result = runPipeline({
      now: agora,
      conveniar: [],
      equipe: [],
      sistema: [],
      planilhaAntiga: [
        {
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": 2,
          "NOME COMPLETO": "Primeira",
          CPF: "222.222.222-22",
        },
        {
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": 2,
          "NOME COMPLETO": "Duplicada",
          CPF: "222.222.222-22",
        },
      ],
      matriculados: [],
    });

    expect(result.planilhaCpf).toHaveLength(1);
    expect(result.planilhaCpf[0]?.["NOME COMPLETO"]).toBe("Primeira");
  });
});
