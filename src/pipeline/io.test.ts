import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { formatDate } from "./formatDate";
import { messageForReadError, readSheet, rowsToWorkbook } from "./io";

function xlsxBytes(sheets: Array<{ name: string; rows: unknown[][] }>): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(sheet.rows),
      sheet.name,
    );
  }
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
}

describe("readSheet", () => {
  it("ignora intervalo usado inflado e não cria colunas vazias", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["CPF", "Nome"],
      ["123.456.789-01", "Ana"],
    ]);
    sheet["!ref"] = "A1:Z5000";
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Dados");
    const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;

    const { rows, headers } = readSheet(bytes);

    expect(headers).toEqual(["CPF", "Nome"]);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0] ?? {})).toEqual(["CPF", "Nome"]);
    expect(rows[0]?.Nome).toBe("Ana");
  });

  it("lê só a primeira aba", () => {
    const bytes = xlsxBytes([
      {
        name: "Pagamentos",
        rows: [
          ["CPF/CNPJ", "Favorecido"],
          ["12345678901", "Ana"],
        ],
      },
      {
        name: "Lixo",
        rows: [
          ["CPF/CNPJ", "Favorecido"],
          ["00000000000", "Outro"],
        ],
      },
    ]);

    const { rows } = readSheet(bytes);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.Favorecido).toBe("Ana");
  });

  it("lê a aba Matrículas Consolidadas quando ela não é a primeira", () => {
    const bytes = xlsxBytes([
      {
        name: "Capa",
        rows: [
          ["Edital", "ID", "CPF", "Status"],
          ["000/1999", "1", "000.000.000-00", "Ignorar"],
        ],
      },
      {
        name: "Matrículas Consolidadas",
        rows: [
          ["Edital", "ID", "CPF", "Status"],
          ["075/2024", "2407500492", "444.444.444-44", "Finalizado"],
        ],
      },
    ]);

    const { rows } = readSheet(bytes, {
      preferSheet: "Matrículas Consolidadas",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.Status).toBe("Finalizado");
    expect(String(rows[0]?.ID)).toBe("2407500492");
  });

  it("lê data do Excel como Date", () => {
    const bytes = xlsxBytes([
      {
        name: "Datas",
        rows: [["DATA DE NASCIMENTO"], [new Date(1990, 2, 15)]],
      },
    ]);

    const { rows } = readSheet(bytes);
    expect(formatDate(rows[0]?.["DATA DE NASCIMENTO"])).toBe("15/03/1990");
  });

  it("lê shared strings do xlsx", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["NOME CIVIL", "CPF"],
        ["Ana", "12345678901"],
      ]),
      "Inscrições",
    );
    const bytes = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
      bookSST: true,
    }) as Uint8Array;

    const { rows, headers } = readSheet(bytes);
    expect(headers).toEqual(["NOME CIVIL", "CPF"]);
    expect(rows[0]?.["NOME CIVIL"]).toBe("Ana");
    expect(String(rows[0]?.CPF)).toBe("12345678901");
  });

  it("lê CSV sem passar pelo parser SheetJS", () => {
    const bytes = new TextEncoder().encode("CPF,Nome\n11111111111,Ana\n");
    const { rows, headers } = readSheet(bytes);
    expect(headers).toEqual(["CPF", "Nome"]);
    expect(rows[0]?.Nome).toBe("Ana");
  });

  it("recusa HTML e OLE disfarçados de planilha", () => {
    const html = new TextEncoder().encode("<!--".repeat(200) + "<table><tr><td>x</td></tr></table>");
    expect(() => readSheet(html)).toThrow(/não é planilha/i);
    const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect(() => readSheet(ole)).toThrow(/\.xls/i);
  });
});

describe("rowsToWorkbook", () => {
  it("grava EDITAL na coluna A mesmo quando a linha tem chave 15", () => {
    const buffer = rowsToWorkbook(
      [
        {
          "15": 99,
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": 15,
          "NOME COMPLETO": "Ana",
          CPF: "111.111.111-11",
        },
      ],
      "Planilha CPF",
    );
    const { headers, rows } = readSheet(buffer);
    expect(headers[0]).toBe("EDITAL");
    expect(headers).not.toContain("15");
    expect(rows[0]?.EDITAL).toBe("103/2025");
    expect(Number(rows[0]?.["N° INSCRIÇÃO"])).toBe(15);
  });

  it("grava CPF mascarado, data em texto e valor numérico", () => {
    const buffer = rowsToWorkbook(
      [
        {
          EDITAL: "103/2025",
          "N° INSCRIÇÃO": "15",
          "NOME COMPLETO": "Ana",
          CPF: 11111111111,
          "DATA DE NASCIMENTO": 32947,
          "VALOR RECEBIDO": 660,
          QUANTIDADE: 1,
        },
      ],
      "Planilha CPF",
    );
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets["Planilha CPF"];
    const headers: string[] = [];
    for (let c = 0; c < 40; c += 1) {
      const header = sheet?.[XLSX.utils.encode_cell({ r: 0, c })];
      if (!header) break;
      headers.push(String(header.v));
    }
    const at = (name: string) => {
      const col = headers.indexOf(name);
      return sheet?.[XLSX.utils.encode_cell({ r: 1, c: col })];
    };
    expect(at("EDITAL")?.t).toBe("s");
    expect(at("EDITAL")?.v).toBe("103/2025");
    expect(at("CPF")?.t).toBe("s");
    expect(at("CPF")?.v).toBe("111.111.111-11");
    expect(at("DATA DE NASCIMENTO")?.t).toBe("s");
    expect(at("DATA DE NASCIMENTO")?.v).toBe("15/03/1990");
    expect(at("NOME COMPLETO")?.t).toBe("s");
    expect(at("NOME COMPLETO")?.v).toBe("Ana");
    expect(at("VALOR RECEBIDO")?.t).toBe("n");
    expect(at("VALOR RECEBIDO")?.v).toBe(660);
    expect(at("N° INSCRIÇÃO")?.t).toBe("n");
    expect(at("N° INSCRIÇÃO")?.v).toBe(15);
  });
});

describe("messageForReadError", () => {
  it("explica falta de memória com o nome do arquivo", () => {
    expect(
      messageForReadError(
        new RangeError("Array buffer allocation failed"),
        "IFPE_LancamentosGestorFinanceiro.xlsx",
      ),
    ).toMatch(/IFPE_LancamentosGestorFinanceiro\.xlsx/);
    expect(
      messageForReadError(
        new RangeError("Array buffer allocation failed"),
        "IFPE_LancamentosGestorFinanceiro.xlsx",
      ),
    ).toMatch(/Memória insuficiente/i);
  });

  it("mantém a mensagem original nos demais erros", () => {
    expect(messageForReadError(new Error("Unsupported file"), "a.xlsx")).toBe(
      "Falha ao ler a.xlsx: Unsupported file",
    );
  });
});
