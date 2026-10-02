/** Script detection affects legibility only; it does not infer a host's language or tradition. */
export function hasIndicText(text: string): boolean {
  return /[\u0900-\u0DFF\uA8E0-\uA8FF]/u.test(text);
}
