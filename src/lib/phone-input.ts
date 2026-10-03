/** Format complete, explicit country-code numbers; never guess a guest’s country. */
export function formatPhoneInput(value: string) {
  const digits = value.replace(/[ ()-]/g, "");
  if (/^\+91\d{10}$/.test(digits)) return `${digits.slice(0, 3)} ${digits.slice(3, 8)} ${digits.slice(8)}`;
  if (/^\+1\d{10}$/.test(digits)) return `+1 (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
  return value;
}
