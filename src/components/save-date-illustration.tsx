import styles from "./save-date-illustration.module.css";

/** User-supplied line illustration, coloured by the current invitation palette. */
export function SaveDateIllustration() {
  return <div className={styles.illustration} data-save-date-illustration data-decoration aria-hidden="true"><span /><i /></div>;
}
