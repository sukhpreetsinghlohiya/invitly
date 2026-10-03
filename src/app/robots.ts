import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/g/", "/i/", "/invite/", "/dashboard", "/account", "/auth/", "/preview", "/customize", "/setup", "/api/"] }, sitemap: new URL("/sitemap.xml", getSiteUrl()).href };
}
