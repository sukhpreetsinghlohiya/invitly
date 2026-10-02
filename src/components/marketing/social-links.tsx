import { siteSocials, type SocialId } from "@/data/site-socials";

function SocialIcon({ id }: { id: SocialId }) {
  const paths: Record<SocialId, React.ReactNode> = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></>,
    facebook: <path d="M14 21v-8h3l.5-4H14V7c0-1 .4-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8" />,
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 6 3-6 3Z" /></>,
    x: <><path d="m4 3 13 18h3L7 3Z" /><path d="m20 3-6.8 8M10.8 14 4 21" /></>,
    linkedin: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 10v7m5 0v-7m0 3c0-4 5-4 5 0v4" /><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none" /></>,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[id]}</svg>;
}

export function SocialLinks() {
  return <div className="footer-socials" aria-label="Invitly on social media">
    <p>Find us around</p>
    <ul>{siteSocials.map(social => <li key={social.id}>{social.url
      ? <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`Invitly on ${social.name}`} title={social.name}><SocialIcon id={social.id} /></a>
      : <span className="footer-social-pending" role="img" aria-label={`${social.name} — coming soon`} title={`${social.name} — coming soon`}><SocialIcon id={social.id} /></span>
    }</li>)}</ul>
  </div>;
}
