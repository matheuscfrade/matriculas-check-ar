import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { MAX_INFLATE_BYTES, readXlsx } from "./xlsxRead";

function pack(parts: Record<string, string>): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const [name, xml] of Object.entries(parts)) files[name] = strToU8(xml);
  return zipSync(files);
}

function sistemaXlsx(sst: string, rowsXml: string): Uint8Array {
  return pack({
    "xl/workbook.xml":
      '<workbook xmlns:r="http://n"><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/sharedStrings.xml": sst,
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData>${rowsXml}</sheetData></worksheet>`,
  });
}

describe("readXlsx", () => {
  it("escolhe a aba pelo nome quando há várias", () => {
    const bytes = pack({
      "xl/workbook.xml":
        '<workbook xmlns:r="http://n"><sheets>' +
        '<sheet name="Capa" sheetId="1" r:id="rId1"/>' +
        '<sheet name="Matrículas Consolidadas" sheetId="2" r:id="rId2"/>' +
        "</sheets></workbook>",
      "xl/_rels/workbook.xml.rels":
        "<Relationships>" +
        '<Relationship Id="rId1" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Target="worksheets/sheet2.xml"/>' +
        "</Relationships>",
      "xl/worksheets/sheet1.xml":
        "<worksheet><sheetData>" +
        '<row r="1"><c r="A1" t="inlineStr"><is><t>Status</t></is></c></row>' +
        '<row r="2"><c r="A2" t="inlineStr"><is><t>Ignorar</t></is></c></row>' +
        "</sheetData></worksheet>",
      "xl/worksheets/sheet2.xml":
        "<worksheet><sheetData>" +
        '<row r="1"><c r="A1" t="inlineStr"><is><t>Status</t></is></c></row>' +
        '<row r="2"><c r="A2" t="inlineStr"><is><t>Finalizado</t></is></c></row>' +
        "</sheetData></worksheet>",
    });

    const { rows } = readXlsx(bytes, "Matrículas Consolidadas");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.Status).toBe("Finalizado");
  });

  it("não desloca shared strings quando há <si/> vazio", () => {
    const bytes = sistemaXlsx(
      "<sst><si><t>CPF</t></si><si/><si><t>11111111111</t></si></sst>",
      '<row r="1"><c r="A1" t="s"><v>0</v></c></row>' +
        '<row r="2"><c r="A2" t="s"><v>2</v></c></row>',
    );

    const { rows, headers } = readXlsx(bytes);
    expect(headers).toEqual(["CPF"]);
    expect(String(rows[0]?.CPF)).toBe("11111111111");
  });

  it("lê todas as linhas com atributo extra no <row>", () => {
    const cells = Array.from({ length: 400 }, (_, i) => {
      const r = i + 2;
      return `<row r="${r}" spans="1:2" x14ac:dyDescent="0.25"><c r="A${r}" t="s"><v>0</v></c><c r="B${r}"><v>${r}</v></c></row>`;
    }).join("");
    const bytes = sistemaXlsx(
      "<sst><si><t>CPF</t></si></sst>",
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="str"><v>N</v></c></row>' +
        cells,
    );

    const { rows } = readXlsx(bytes);
    expect(rows).toHaveLength(400);
    expect(rows[399]?.N).toBe(401);
  });

  it("lê cabeçalho inlineStr do pandas e não usa 15 como nome de coluna", () => {
    const bytes = pack({
      "xl/workbook.xml":
        '<workbook xmlns:r="http://n"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="/xl/worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
        <row r="1">
          <c r="A1" s="1" t="inlineStr"><is><t>EDITAL</t></is></c>
          <c r="B1" s="1" t="inlineStr"><is><t>N° INSCRIÇÃO</t></is></c>
        </row>
        <row r="2">
          <c r="A2" t="inlineStr"><is><t>103/2025</t></is></c>
          <c r="B2" t="n"><v>15</v></c>
        </row>
      </sheetData></worksheet>`,
    });

    const { headers, rows } = readXlsx(bytes);
    expect(headers[0]).toBe("EDITAL");
    expect(headers).toEqual(["EDITAL", "N° INSCRIÇÃO"]);
    expect(rows[0]?.EDITAL).toBe("103/2025");
    expect(rows[0]?.["N° INSCRIÇÃO"]).toBe(15);
  });

  it("usa a shared string no cabeçalho quando t=s está omitido", () => {
    const sst = Array.from({ length: 16 }, (_, i) =>
      i === 15 ? "<si><t>EDITAL</t></si>" : `<si><t>x${i}</t></si>`,
    ).join("");
    const bytes = sistemaXlsx(
      `<sst>${sst}<si><t>N° INSCRIÇÃO</t></si></sst>`,
      '<row r="1"><c r="A1"><v>15</v></c><c r="B1" t="s"><v>16</v></c></row>' +
        '<row r="2"><c r="A2" t="str"><v>103/2025</v></c><c r="B2"><v>1</v></c></row>',
    );

    const { headers, rows } = readXlsx(bytes);
    expect(headers[0]).toBe("EDITAL");
    expect(headers).not.toContain("15");
    expect(rows[0]?.EDITAL).toBe("103/2025");
    expect(rows[0]?.["N° INSCRIÇÃO"]).toBe(1);
  });

  it("não engole o CPF quando a célula anterior é auto-fechada", () => {
    const bytes = sistemaXlsx(
      "<sst></sst>",
      '<row r="1">' +
        '<c r="A1" t="inlineStr"><is><t>NOME CIVIL</t></is></c>' +
        '<c r="B1" t="inlineStr"><is><t>NOME SOCIAL</t></is></c>' +
        '<c r="C1" t="inlineStr"><is><t>CPF</t></is></c>' +
        "</row>" +
        '<row r="2">' +
        '<c r="A2" t="inlineStr"><is><t>ANA</t></is></c>' +
        '<c r="B2" s="0" />' +
        '<c r="C2" t="inlineStr"><is><t>11111111111</t></is></c>' +
        "</row>",
    );

    const { rows } = readXlsx(bytes);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.["NOME CIVIL"]).toBe("ANA");
    expect(rows[0]?.CPF).toBe("11111111111");
  });

  it("não usa a primeira linha de dados (edital + inscrição 15) como cabeçalho", () => {
    const bytes = sistemaXlsx(
      "<sst></sst>",
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
        '<row r="2"><c r="A2" t="str"><v>103/2025</v></c><c r="B2"><v>15</v></c><c r="C2" t="str"><v>Ana</v></c></row>',
    );

    const { headers, rows } = readXlsx(bytes);
    expect(headers[0]).toBe("EDITAL");
    expect(headers).not.toContain("15");
    expect(rows[0]?.EDITAL).toBe("103/2025");
    expect(rows[0]?.["N° INSCRIÇÃO"]).toBe(15);
    expect(rows[0]?.["NOME COMPLETO"]).toBe("Ana");
  });

  it("recusa ZIP cuja entrada descomprimida passa do teto", () => {
    const bytes = sistemaXlsx(
      "<sst></sst>",
      '<row r="1"><c r="A1" t="inlineStr"><is><t>CPF</t></is></c></row>',
    );
    const bombed = setClaimedUncompressed(bytes, MAX_INFLATE_BYTES + 1);
    expect(() => readXlsx(bombed)).toThrow(/descomprimido/i);
  });

  it("lê planilha ZIP64 cujo cabeçalho 32 bits marca 0xFFFFFFFF", () => {
    const bytes = sistemaXlsx(
      "<sst></sst>",
      '<row r="1"><c r="A1" t="inlineStr"><is><t>CPF</t></is></c></row>' +
        '<row r="2"><c r="A2" t="inlineStr"><is><t>11111111111</t></is></c></row>',
    );
    const marked = setClaimedUncompressed(bytes, 0xffffffff);
    const { rows } = readXlsx(marked);
    expect(rows[0]?.CPF).toBe("11111111111");
  });
});

function setClaimedUncompressed(data: Uint8Array, size: number): Uint8Array {
  const out = new Uint8Array(data);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  for (let i = 0; i <= out.length - 30; i += 1) {
    const sig = view.getUint32(i, true);
    if (sig === 0x04034b50) view.setUint32(i + 22, size, true);
    if (sig === 0x02014b50) view.setUint32(i + 24, size, true);
  }
  return out;
}

