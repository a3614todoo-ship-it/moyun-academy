import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com https://player.vimeo.com https://vimeo.com https://meet.google.com https://*.zoom.us",
  "media-src 'self' blob: https:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const privateNoStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privateNoStoreHeaders },
      { source: "/account", headers: privateNoStoreHeaders },
      { source: "/apply/success", headers: privateNoStoreHeaders },
      { source: "/payment-report/success", headers: privateNoStoreHeaders },
      { source: "/course-purchase/success", headers: privateNoStoreHeaders },
      { source: "/course-payment-report/success", headers: privateNoStoreHeaders },
      { source: "/courses/:slug/live", headers: privateNoStoreHeaders },
      { source: "/courses/:slug/watch", headers: privateNoStoreHeaders },
    ];
  },
};

export default nextConfig;
