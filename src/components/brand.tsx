import Link from "next/link";
import Image from "next/image";

export function Flower({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
    {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="40" cy="22" rx="9" ry="19" fill="currentColor" transform={`rotate(${i * 45} 40 40)`} />)}
    <circle cx="40" cy="40" r="8" fill="var(--flower-centre, #f7edcf)" />
  </svg>;
}

export function BrandMark() {
  return <Image className="brand-mark" src="/images/brand/invitly-mark.png" width={90} height={160} alt="" aria-hidden="true" unoptimized />;
}

export function Brand() {
  return <Link href="/" className="brand" aria-label="Invitly home"><BrandMark /><span>invitly<span className="brand-dot">.</span></span></Link>;
}
