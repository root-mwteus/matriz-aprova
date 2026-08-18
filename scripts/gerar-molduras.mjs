// Gera as molduras de avatar (PNG 512×512 transparentes) em molduras/<slug>.png.
// Desenho: anel circular com vão central (a foto aparece no buraco) e brilho
// opcional — sem dependências, escreve o PNG na mão com zlib do Node.
// Uso: node scripts/gerar-molduras.mjs

import { deflateSync } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = dirname(fileURLToPath(import.meta.url))

const SIZE = 512
const C = SIZE / 2
// O vão central tem o diâmetro do avatar (o Avatar exibe a moldura a 140%,
// então o buraco = 100/140 do PNG) — a foto encaixa exata no anel.
const RI = SIZE / 2 / 1.4
const RO = 218
const GLOW = 16

// ── PNG encoder (sem lib externa) ──────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, "ascii")
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0 // filter none
    rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))])
}

// ── Render ─────────────────────────────────────────────────────────
function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

function clamp(v) {
  return Math.max(0, Math.min(255, v))
}

// 1 fora de e0, 0 fora de e1 (interpolação linear para anti-serrilha).
function edge(e0, e1, d) {
  if (e0 === e1) return d < e0 ? 1 : 0
  return clamp((d - e0) / (e1 - e0))
}

function render(spec) {
  const buf = Buffer.alloc(SIZE * SIZE * 4)
  const colA = hex(spec.a)
  const colB = hex(spec.b)
  const glowC = hex(spec.glow ?? spec.a)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - C + 0.5
      const dy = y - C + 0.5
      const d = Math.sqrt(dx * dx + dy * dy)

      // Cobertura do anel: dentro da borda externa e fora do vão central.
      const aOut = edge(RO + 1.5, RO - 1.5, d)
      const aIn = edge(RI - 1.5, RI + 1.5, d)
      let alpha = aOut * aIn
      if (alpha <= 0.02) continue

      // Gradiente diagonal (luz no canto superior esquerdo).
      let rgb = mix(colA, colB, (x + y) / (SIZE * 2))

      // Bisel 3D: realce na borda interna, sombra na externa.
      const lum =
        1 +
        0.18 * edge(RI + 8, RI, d) -
        0.22 * edge(RO - 8, RO, d)
      rgb = rgb.map((v) => clamp(Math.round(v * lum)))

      // Brilho: véu do tom de destaque além da borda externa.
      if (spec.glow && d > RO) {
        const glowA = spec.glowAlpha * edge(RO, RO + GLOW, d)
        if (glowA > 0.01) {
          const g = mix(rgb, glowC, 0.5)
          const tot = alpha + glowA * (1 - alpha)
          rgb = mix(rgb, g, (glowA * (1 - alpha)) / tot)
          alpha = tot
        }
      }

      const i = (y * SIZE + x) * 4
      buf[i] = rgb[0]
      buf[i + 1] = rgb[1]
      buf[i + 2] = rgb[2]
      buf[i + 3] = Math.round(alpha * 255)
    }
  }
  return encodePng(buf)
}

// Catálogo — mesmo shape da tabela `molduras` (slug/nome/desbloqueio).
const MOLDURAS = [
  { slug: "cinza", nome: "Cinza", desbloqueio: "livre", a: "#f1f5f9", b: "#94a3b8" },
  { slug: "esmeralda", nome: "Esmeralda", desbloqueio: "vitalicio", a: "#6ee7b7", b: "#047857", glow: "#34d399", glowAlpha: 0.7 },
  { slug: "ouro", nome: "Ouro", desbloqueio: "vitalicio", a: "#fde68a", b: "#b45309", glow: "#fbbf24", glowAlpha: 0.6 },
  { slug: "violeta", nome: "Violeta", desbloqueio: "livre", a: "#ddd6fe", b: "#7c3aed", glow: "#a78bfa", glowAlpha: 0.5 },
]

const outDir = join(ROOT, "..", "molduras")
mkdirSync(outDir, { recursive: true })

for (const m of MOLDURAS) {
  const png = render(m)
  const file = join(outDir, `${m.slug}.png`)
  writeFileSync(file, png)
  console.log(`[ok] ${m.slug}.png (${png.length} bytes, ${m.nome}, ${m.desbloqueio})`)
}