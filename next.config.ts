import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.INVITLY_BUILD_DIR || ".next",
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  // Guest uploads must always pass their current publication/ownership checks.
  // The shared optimizer caches bytes even when their origin sends no-store.
  images: { localPatterns: [
    { pathname: "/images/**", search: "" },
    { pathname: "/_next/static/media/**", search: "" },
  ] },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }, { source: "/preview", headers: [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      { key: "Cache-Control", value: "private, no-store" },
    ] }];
  },
};

export default nextConfig;
