"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="utility-page"><div className="utility-card"><span className="eyebrow">A SMALL INTERRUPTION</span><h1>Let&apos;s try that again.</h1><p>We couldn&apos;t load this page. Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button><Link className="text-link" href="/">Back to Invitly</Link></div></main>;
}
