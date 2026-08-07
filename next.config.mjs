import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    domains: [],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      // Supabase (auth/rest/storage) e Vercel Analytics.
      // 'unsafe-inline' no script é exigido pelos scripts de hidratação do Next.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-analytics.com",
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "upgrade-insecure-requests",
    ].join("; ")

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "matriz-aprova",
  // TODO: confirmar o slug do projeto em Settings > Projects e habilitar
  // source maps (`release.create` + `sourcemaps.disable: false`).
  project: "matriz-aprova-nextjs",
  silent: !process.env.CI,
  hideSourceMaps: true,
  disableLogger: true,
  release: { create: false, finalize: false },
  sourcemaps: { disable: true },
})
