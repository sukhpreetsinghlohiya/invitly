import styles from "./archive-ornament.module.css";

/** Locally hosted public-domain engravings; provenance lives in public/licenses. */
export function ArchiveOrnament({ kind, className = "" }: { kind: "branch" | "flourish" | "balloon"; className?: string }) {
  return <span className={`${styles.ornament} ${styles[kind]} ${className}`} data-archive-ornament={kind} data-decoration aria-hidden="true" />;
}
