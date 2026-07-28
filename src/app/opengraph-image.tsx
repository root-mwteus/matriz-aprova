import { ImageResponse } from "next/og"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants"

/**
 * Imagem de compartilhamento.
 *
 * Sem ela, um link colado no WhatsApp ou no Twitter aparece como texto
 * cinza sem imagem — o que, para um produto que se divulga por
 * indicação, é a primeira impressão desperdiçada.
 *
 * Gerada no build a partir dos tokens, então marca e cores acompanham o
 * resto do produto sem ninguém precisar reexportar um PNG.
 */

export const alt = SITE_NAME
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08090A",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#C2F04C",
              color: "#16210A",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ color: "#ECEEF0", fontSize: 30, fontWeight: 600 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              color: "#ECEEF0",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.8,
              maxWidth: 900,
            }}
          >
            Sua aprovação começa aqui.
          </div>
          <div style={{ color: "#A4ABB3", fontSize: 28, lineHeight: 1.4, maxWidth: 820 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>

        {/* Filete de acento no rodapé: assina a peça sem competir com o texto. */}
        <div style={{ display: "flex", height: 6, width: 180, background: "#C2F04C", borderRadius: 3 }} />
      </div>
    ),
    size
  )
}
