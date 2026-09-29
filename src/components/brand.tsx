import Link from "next/link";

export function Flower({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
    {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="40" cy="22" rx="9" ry="19" fill="currentColor" transform={`rotate(${i * 45} 40 40)`} />)}
    <circle cx="40" cy="40" r="8" fill="var(--flower-centre, #f7edcf)" />
  </svg>;
}

export function Brand() {
  return <Link href="/" className="brand" aria-label="Invitly home"><Flower /><span>invitly<span className="brand-dot">.</span></span></Link>;
}

export function Footer() {
  return <footer className="site-footer container"><Brand /><p>A little link. A lot of togetherness.</p><span>Made by Sukhpreet</span></footer>;
}
