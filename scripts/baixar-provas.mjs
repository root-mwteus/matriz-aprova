import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import * as cheerio from "cheerio"

const ROOT = dirname(fileURLToPath(import.meta.url).replace(/\/scripts$/, "/"))
const OUT = join(ROOT, "provas")
const LIST_URL = "https://www.provasbrasil.com.br/provas-anteriores/"
const MAX_PROVAS = 60
const CONCURRENCY = 4
const TIMEOUT = 15000

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "MatrizAprova-Bot/1.0 (+https://matrizaprova.com) - coleta de provas publicas para estudo" },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  return await res.text()
}

async function descobrirListagem() {
  console.log(`Buscando listagem: ${LIST_URL}`)
  const html = await fetchHtml(LIST_URL)
  const $ = cheerio.load(html)
  const links = new Set()
  $('a[href*="/provas-anteriores/"]').each((_, el) => {
    const href = $(el).attr("href") || ""
    if (!href.includes("/provas-anteriores/")) return
    if (href === "/provas-anteriores/" || href.endsWith("/provas-anteriores")) return
    const abs = href.startsWith("http") ? href : `https://www.provasbrasil.com.br${href}`
    // filtra links de categoria/blog, mantém só detalhe de prova (slug com 3+ partes)
    if (abs.split("/").length >= 5) links.add(abs)
  })
  const lista = [...links].slice(0, 120)
  console.log(`Encontrados ${lista.length} links de provas, usando ${Math.min(MAX_PROVAS, lista.length)}`)
  return lista.slice(0, MAX_PROVAS)
}

async function extrairPdfsDaPagina(detailUrl) {
  try {
    const html = await fetchHtml(detailUrl)
    const $ = cheerio.load(html)
    const pdfs = []
    $('a[href$=".pdf"], a[href*=".pdf?"]').each((_, el) => {
      const href = $(el).attr("href") || ""
      const texto = $(el).text().trim().toLowerCase()
      // prioriza links com "prova" ou "caderno" no texto, mas pega todos pdfs da página
      const abs = href.startsWith("http") ? href : new URL(href, detailUrl).toString()
      if (abs.includes(".pdf")) pdfs.push({ url: abs, texto: texto.slice(0, 60) })
    })
    // fallback: procura iframes com pdf
    $('iframe[src*=".pdf"]').each((_, el) => {
      const src = $(el).attr("src") || ""
      const abs = src.startsWith("http") ? src : new URL(src, detailUrl).toString()
      pdfs.push({ url: abs, texto: "iframe" })
    })
    // dedupe por url
    const uniq = [...new Map(pdfs.map((p) => [p.url, p])).values()]
    return uniq.slice(0, 4) // até 4 pdfs por prova (prova + gabarito)
  } catch (e) {
    console.warn(`  ! Falha ao extrair ${detailUrl}: ${e.message}`)
    return []
  }
}

async function baixarPdf(url, dest) {
  if (existsSync(dest)) {
    console.log(`  = Já existe: ${dest}`)
    return true
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MatrizAprova-Bot/1.0" },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("pdf") && !url.toLowerCase().includes(".pdf")) {
      console.warn(`  ! Não é PDF (${ct}): ${url}`)
      return false
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000) {
      console.warn(`  ! PDF muito pequeno (${buf.length} bytes): ${url}`)
      return false
    }
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, buf)
    console.log(`  ✓ ${dest} (${(buf.length / 1024).toFixed(0)} KB)`)
    return true
  } catch (e) {
    console.warn(`  ! Falha download ${url}: ${e.message}`)
    return false
  }
}

async function main() {
  const lista = await descobrirListagem()
  if (!lista.length) {
    console.error("Nenhuma prova encontrada na listagem")
    process.exit(1)
  }

  mkdirSync(OUT, { recursive: true })
  let baixados = 0
  let tentados = 0

  // processa em lotes para respeitar concorrência
  for (let i = 0; i < lista.length; i += CONCURRENCY) {
    const lote = lista.slice(i, i + CONCURRENCY)
    const resultados = await Promise.all(
      lote.map(async (detailUrl) => {
        const slug = detailUrl.replace("https://www.provasbrasil.com.br/provas-anteriores/", "").replace(/\/$/, "")
        // tenta inferir banca do slug (último segmento após último -)
        const partes = slug.split("-")
        const bancaGuess = partes[partes.length - 1] || "outros"
        const base = slugify(slug)
        const pdfs = await extrairPdfsDaPagina(detailUrl)
        if (!pdfs.length) {
          console.log(`  - Sem PDFs em ${detailUrl}`)
          return 0
        }
        let ok = 0
        for (const pdf of pdfs) {
          const nome = `${base}--${slugify(pdf.texto || "prova")}.pdf`.replace(/--+/g, "--")
          const dest = join(OUT, slugify(bancaGuess), nome)
          if (await baixarPdf(pdf.url, dest)) ok++
          // só 1 pdf por prova para garantir variedade (60 provas = 60 arquivos)
          if (ok >= 1) break
        }
        return ok
      }),
    )
    baixados += resultados.reduce((a, b) => a + b, 0)
    tentados += lote.length
    console.log(`Progresso: ${tentados}/${lista.length} páginas, ${baixados} PDFs baixados`)
    if (baixados >= MAX_PROVAS) break
    // pausa leve para não sobrecarregar
    await new Promise((r) => setTimeout(r, 600))
  }

  // lista final
  const arquivos = []
  function coletar(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) coletar(p)
      else arquivos.push(p)
    }
  }
  if (existsSync(OUT)) coletar(OUT)
  console.log(`\nConcluído: ${arquivos.length} arquivos em provas/`)
  for (const f of arquivos.slice(0, 20)) console.log(`  - ${f}`)
  if (arquivos.length < 60) {
    console.warn(`\nAviso: só ${arquivos.length}/60. Rode novamente ou aumente MAX_PROVAS. Algumas provas podem ter PDF bloqueado.`)
  }
  // salva manifesto
  writeFileSync(join(OUT, "_manifesto.json"), JSON.stringify({ gerado_em: new Date().toISOString(), total: arquivos.length, arquivos: arquivos.map((a) => a.replace(OUT + "/", "")) }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
