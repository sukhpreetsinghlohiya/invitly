import "./page-skeleton.css";
export function PageSkeleton({ label = "Getting everything ready…" }: { label?: string }) {
  return <main id="main" className="page-skeleton container" aria-busy="true"><p role="status">{label}</p><div aria-hidden="true"><span className="skeleton-block skeleton-title" /><span className="skeleton-block skeleton-copy" /><div className="skeleton-grid">{[0, 1, 2].map(item => <div key={item}><span className="skeleton-block skeleton-art" /><span className="skeleton-block skeleton-copy" /></div>)}</div></div></main>;
}
