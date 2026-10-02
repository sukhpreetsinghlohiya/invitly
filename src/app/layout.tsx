import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";
import "./theme-collection.css";
import "./design-system.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Invitly — A little link. A lot of togetherness.", template: "%s | Invitly" },
  description: "Thoughtful digital invitations for Indian celebrations. Share your story, collect RSVPs, and keep your people close, from the first invite to the last dance.",
  openGraph: { type: "website", locale: "en_IN", siteName: "Invitly" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f9f6ef" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a>{children}</body></html>;
}
