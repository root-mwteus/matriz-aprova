import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants"

/**
 * Fontes auto-hospedadas via `next/font`.
 *
 * Antes vinham de um `<link>` para o Google Fonts, que custa duas
 * conexões extras e uma folha de estilo bloqueante antes do primeiro
 * texto aparecer. Agora os arquivos são servidos do próprio domínio, com
 * `size-adjust` calculado — o que elimina também o salto de layout na
 * troca da fonte de fallback pela real.
 *
 * Inter entra como fonte variável (400–700): a escala tipográfica usa
 * pesos intermediários (560 e 640) que os cortes estáticos arredondariam.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  // A barra do navegador acompanha o fundo da aplicação no mobile.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8F9" },
    { media: "(prefers-color-scheme: dark)", color: "#08090A" },
  ],
}

/**
 * Aplica o tema salvo antes da primeira pintura. Se rodasse depois da
 * hidratação, quem usa tema escuro veria um lampejo branco a cada carga.
 */
const temaScript = `(function(){try{var t=localStorage.getItem('matriz-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
      </head>
      <body className="antialiased">
        {children}

        {/* Notificações herdam os tokens: uma paleta só em toda a aplicação. */}
        <Toaster
          theme="dark"
          position="bottom-right"
          gap={8}
          toastOptions={{
            style: {
              background: "var(--surface)",
              border: "1px solid var(--line-strong)",
              color: "var(--text)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-lg)",
              fontSize: "13px",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
