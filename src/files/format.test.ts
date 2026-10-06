import { describe, expect, it } from "vitest";
import { formatBytes } from "./format";

describe("formatBytes", () => {
  it("mostra bytes abaixo de 1 KB", () => {
    expect(formatBytes(800)).toBe("800 B");
  });

  it("mostra KB em pt-BR", () => {
    expect(formatBytes(840 * 1024)).toBe("840 KB");
  });

  it("mostra MB com uma casa decimal", () => {
    expect(formatBytes(1.2 * 1024 * 1024)).toBe("1,2 MB");
  });
});
