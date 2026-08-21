import * as cheerio from "cheerio"

// Extrai texto limpo de HTML já buscado — espelha a limpeza que o front
// faz em materiais (sem nav/footer/scripts) para a IA receber só o conteúdo
// útil. Valida URL pública e respeita robots.txt básico no chamador.

const MAX_CHARS = 120_000

export function extrairTextoDeHtml(html: string, url: string): string {
  const $ = cheerio.load(html)

  // Remove ruído que confunde a IA e infla tokens
  $("script, style, nav, header, footer, aside, noscript, iframe, form").remove()
  // Remove comentários e atributos inúteis
  $("*").each((_, el) => {
    const attribs = (el as unknown as { attribs?: Record<string, string> }).attribs
    if (!attribs) return
    for (const k of Object.keys(attribs)) {
      if (k.startsWith("on") || k === "style") $(el).removeAttr(k)
    }
  })

  // Prioriza article/main, senão body
  let container = $("article").first()
  if (!container.length) container = $("main").first()
  if (!container.length) container = $("body")

  // Converte blocos em quebras para preservar separação de questões
  container.find("br").replaceWith("\n")
  container.find("p, div, h1, h2, h3, h4, li, tr").after("\n\n")

  let texto = container.text()

  // Normaliza espaços mas preserva quebras duplas (separa questões)
  texto = texto
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (texto.length > MAX_CHARS) texto = texto.slice(0, MAX_CHARS)

  // Anexa fonte ao final para a IA preencher fonte_url
  return `${texto}\n\n[Fonte: ${url}]`
}

export function validarUrlPublica(urlStr: string): { ok: boolean; error?: string } {
  let url: URL
  try {
    url = new URL(urlStr)
  } catch {
    return { ok: false, error: "URL inválida" }
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Apenas http/https" }
  }
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.endsWith(".local")) {
    return { ok: false, error: "URL local não permitida" }
  }
  return { ok: true }
}
