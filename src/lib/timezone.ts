/** All persisted instants are UTC; wall-clock inputs are interpreted in the event zone. */
export function toZonedInput(iso: string, zone: string): string {
  const instant = new Date(iso);
  if (!Number.isFinite(instant.getTime())) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant);
    const value = (name: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === name)?.value;
    return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
  } catch { return ""; }
}

export function fromZonedInput(wall: string, zone: string): { value?: string; error?: string } {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wall)) return { error: "Choose a complete date and time." };
  const nominal = new Date(`${wall}:00Z`);
  if (!Number.isFinite(nominal.getTime()) || nominal.toISOString().slice(0, 16) !== wall) return { error: "That calendar date or time does not exist." };
  try { new Intl.DateTimeFormat("en", { timeZone: zone }).format(0); }
  catch { return { error: "Choose a valid event timezone." }; }
  // Sampling both sides of a transition discovers both offsets. A round-trip
  // then rejects spring-forward gaps and fall-back ambiguity, rather than
  // silently moving the ceremony to another time.
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = nominal.getTime() + hours * 3600000;
    const local = toZonedInput(new Date(sample).toISOString(), zone);
    offsets.add(Date.parse(`${local}:00Z`) - sample);
  }
  const matches = [...offsets].map(offset => new Date(nominal.getTime() - offset).toISOString()).filter(iso => toZonedInput(iso, zone) === wall);
  if (!matches.length) return { error: "This time is skipped by the timezone’s clock change. Choose another time." };
  if (matches.length > 1) return { error: "This time occurs twice during the timezone’s clock change. Choose a time outside the repeated hour." };
  return { value: matches[0] };
}
