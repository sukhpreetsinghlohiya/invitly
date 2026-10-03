// Supply these deployment values before publishing the legal notices as final.
const name = process.env.INVITLY_LEGAL_NAME?.trim() || "";
const email = process.env.INVITLY_PRIVACY_EMAIL?.trim() || "";
const country = process.env.INVITLY_LEGAL_COUNTRY?.trim() || "";
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const legalDetails = { name, email: validEmail ? email : "", country, complete: Boolean(name && validEmail && country && process.env.INVITLY_LEGAL_REVIEWED === "true") };
