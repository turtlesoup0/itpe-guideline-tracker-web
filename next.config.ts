import type { NextConfig } from "next";

// ── 보안 헤더 (OWASP 권장) ──
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      // API 백엔드 (Cloudflared Quick Tunnel은 매 재시작마다 URL이 바뀌므로 와일드카드)
      // 로컬 개발용 백엔드는 8001 (itpe-guideline-tracker-api). 8000은 별도 서비스가 점유.
      "connect-src 'self' https://itpe-law-tracker.vercel.app https://law-tracker.tech-insight.org https://api.tech-insight.org https://*.trycloudflare.com http://localhost:8001",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  poweredByHeader: false,
};

export default nextConfig;
