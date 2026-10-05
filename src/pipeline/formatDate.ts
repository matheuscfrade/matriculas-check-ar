function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fromParts(day: number, month: number, year: number): string | null {
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${pad(day)}/${pad(month)}/${year}`;
}

function fromExcelSerial(value: number): string | null {
  if (!Number.isFinite(value) || value < 1 || value >= 100000) return null;
  const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
  return fromParts(utc.getUTCDate(), utc.getUTCMonth() + 1, utc.getUTCFullYear());
}

export function formatDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
  }

  if (typeof value === "number") {
    const serial = fromExcelSerial(value);
    if (serial) return serial;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return raw;

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const formatted = fromParts(Number(dmy[1]), Number(dmy[2]), Number(dmy[3]));
    if (formatted) return formatted;
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const formatted = fromParts(Number(iso[3]), Number(iso[2]), Number(iso[1]));
    if (formatted) return formatted;
  }

  return raw;
}
