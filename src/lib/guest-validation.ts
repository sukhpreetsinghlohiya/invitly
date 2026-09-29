export type GuestInput = { id?: string; name: string; email: string; phone: string; groupId: string | null; maxPartySize: number };
export type GuestCsvRow = { name: string; email: string; phone: string; group: string; maxPartySize: number };
export const isGuestToken = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const controls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function validateGuest(input: GuestInput): string | null {
  if (!input || typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 120 || controls.test(input.name)) return "Enter a guest name using 1–120 characters.";
  if (typeof input.email !== "string" || input.email.length > 254 || (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))) return "Enter a valid email address, or leave it blank.";
  if (typeof input.phone !== "string" || (input.phone && !/^[+0-9() .-]{5,40}$/.test(input.phone.trim()))) return "Enter a phone number using 5–40 digits and common separators, or leave it blank.";
  if (!Number.isInteger(input.maxPartySize) || input.maxPartySize < 1 || input.maxPartySize > 20) return "Party size must be a whole number from 1 to 20.";
  if (input.groupId !== null && (typeof input.groupId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.groupId))) return "Choose a valid guest group.";
  return null;
}

/** RFC 4180-style quoted fields, commas, and CRLF/newlines. Bounded before parsing. */
export function parseGuestCsv(source: string): { rows?: GuestCsvRow[]; error?: string } {
  if (typeof source !== "string" || new TextEncoder().encode(source).length > 512000) return { error: "Choose a CSV file smaller than 500 KB." };
  const input = source.replace(/^\uFEFF/, "");
  const table: string[][] = []; let row: string[] = []; let field = ""; let quoted = false; let closed = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closed) return { error: "A CSV quote is misplaced. Use standard quoted fields." };
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field); field = ""; closed = false;
      if (char !== ',') {
        if (char === '\r' && input[i + 1] === '\n') i++;
        if (row.some(value => value.trim())) table.push(row);
        row = [];
      }
    } else {
      if (closed) return { error: "Unexpected text after a quoted CSV field." };
      field += char;
    }
    if (table.length > 501) return { error: "Import no more than 500 guests at once." };
  }
  if (quoted) return { error: "A quoted CSV field is not closed." };
  row.push(field); if (row.some(value => value.trim())) table.push(row);
  const expected = ["name", "email", "phone", "group", "max_party_size"];
  if (!table.length || table[0].map(v => v.trim().toLowerCase()).join(",") !== expected.join(",")) return { error: "Use these CSV columns in order: name,email,phone,group,max_party_size." };
  if (table.length < 2) return { error: "Add at least one guest below the CSV header." };
  if (table.length > 501) return { error: "Import no more than 500 guests at once." };
  const rows: GuestCsvRow[] = [];
  for (let i = 1; i < table.length; i++) {
    if (table[i].length !== 5) return { error: `Row ${i + 1} must have five columns.` };
    const [name, email, phone, group, party] = table[i].map(v => v.trim());
    const maxPartySize = /^\d+$/.test(party) ? Number(party) : NaN;
    const error = validateGuest({ name, email, phone, groupId: null, maxPartySize });
    if (error) return { error: `Row ${i + 1}: ${error}` };
    if (group.length > 80 || controls.test(group)) return { error: `Row ${i + 1}: group name must use at most 80 characters.` };
    rows.push({ name, email: email.toLowerCase(), phone, group, maxPartySize });
  }
  return { rows };
}

/** Prefix formula-like values so exported guest input stays data in spreadsheets. */
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^\s*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function guestCsv(headers: string[], rows: (string | number)[][]) {
  return [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}
