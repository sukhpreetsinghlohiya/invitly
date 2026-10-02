import Link from "next/link";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="journal-page"><header className="journal-header container"><Brand /><nav aria-label="Journal navigation"><Link href="/blog" className="journal-header-link">The journal</Link><Link href="/templates" className="button button-small">Find your design <span aria-hidden="true">↗</span></Link></nav></header><main id="main">{children}</main><Footer /></div>;
}
