import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getSessionUser } from "@/lib/supabase/auth"
import { extrairTextoDePdf } from "@/lib/importar-questoes/extract-pdf"
import { extrairTextoDeHtml, validarUrlPublica } from "@/lib/importar-questoes/extract-url"
import { parseChunksComIA } from "@/lib/importar-questoes/parse-ia"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_PDF_MB = 20
const MAX_PAGINAS = 200
const MAX_URLS = 10

/**
 * POST /api/admin/questoes/importar/parse
 *
 * Admin cola PDF (multipart `file`) ou JSON `{urls: string[], bancaHint?, areaConcurso?}`.
 * Extrai texto bruto, chunk 8k+500 e chama gpt-4o-mini com prompt literal do extrator.md.
 * Não grava em `questions` — devolve `questoes[]` para preview editável.
 * Cria linha em `importacoes_questoes` para auditoria (total_extraidas, custo).
 */
export async function POST(request: Request) {
  const session = await getSessionUser()
  if (!session || session.suspenso || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const adminIdFinal = session.user.id

  let textoCompleto = ""
  let fonte = ""
  let fonteUrl: string | null = null
  let fonteTipo: "pdf" | "url" = "pdf"
  let paginas = 0

  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    const file = form.get("file") as File | null
    const bancaHint = (form.get("bancaHint") as string | null)?.trim() || null

    if (!file) return NextResponse.json({ error: "Envie um PDF em `file`" }, { status: 400 })
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      return NextResponse.json({ error: `PDF acima de ${MAX_PDF_MB} MB` }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Apenas PDF" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    fonte = `pdf:${file.name}`
    fonteTipo = "pdf"

    let extraido: { texto: string; paginas: number }
    try {
      extraido = await extrairTextoDePdf(buffer)
    } catch (e) {
      return NextResponse.json({ error: `Falha ao ler PDF: ${(e as Error).message}` }, { status: 400 })
    }
    if (extraido.paginas > MAX_PAGINAS) {
      return NextResponse.json({ error: `PDF com ${extraido.paginas} páginas (limite ${MAX_PAGINAS})` }, { status: 400 })
    }
    textoCompleto = extraido.texto
    paginas = extraido.paginas
    fonteUrl = null

    // bancaHint vai no prompt como hint, não como fonteUrl
    ;(globalThis as unknown as { __bancaHint?: string | null }).__bancaHint = bancaHint
  } else {
    let body: { urls?: string[]; bancaHint?: string | null; areaConcurso?: string | null }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }
    const urls = (body.urls ?? []).map((u) => u.trim()).filter(Boolean)
    if (!urls.length) return NextResponse.json({ error: "Informe ao menos 1 URL" }, { status: 400 })
    if (urls.length > MAX_URLS) return NextResponse.json({ error: `Máximo ${MAX_URLS} URLs por vez` }, { status: 400 })

    for (const u of urls) {
      const v = validarUrlPublica(u)
      if (!v.ok) return NextResponse.json({ error: `${u}: ${v.error}` }, { status: 400 })
    }

    fonteTipo = "url"
    fonte = urls.join(",")
    fonteUrl = urls[0] ?? null
    const bancaHint = body.bancaHint ?? null

    const partes: string[] = []
    for (const url of urls) {
      const res = await fetch(url, {
        headers: { "User-Agent": "MatrizAprova-Import/1.0 (+https://matrizaprova.com)" },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) return NextResponse.json({ error: `Falha ao buscar ${url}: ${res.status}` }, { status: 400 })
      const html = await res.text()
      partes.push(extrairTextoDeHtml(html, url))
    }
    textoCompleto = partes.join("\n\n---\n\n")
    ;(globalThis as unknown as { __bancaHint?: string | null }).__bancaHint = bancaHint ?? null
  }

  if (!textoCompleto.trim()) {
    return NextResponse.json({ error: "Nenhum texto extraído da fonte" }, { status: 400 })
  }

  const bancaHintGlobal = (globalThis as unknown as { __bancaHint?: string | null }).__bancaHint ?? null

  let parsed: Awaited<ReturnType<typeof parseChunksComIA>>
  try {
    parsed = await parseChunksComIA(textoCompleto, {
      fonte,
      fonteUrl,
      bancaHint: bancaHintGlobal,
    })
  } catch (e) {
    return NextResponse.json({ error: `Falha na IA: ${(e as Error).message}` }, { status: 502 })
  }

  // Audita — não bloqueia se a tabela ainda não foi migrada (dev sem migration)
  let jobId: string | null = null
  try {
    const { data: job } = await admin
      .from("importacoes_questoes")
      .insert({
        admin_id: adminIdFinal,
        fonte_tipo: fonteTipo,
        arquivo_path: fonteTipo === "pdf" ? fonte : null,
        urls: fonteTipo === "url" ? fonte.split(",") : [],
        status: "processing",
        total_extraidas: parsed.questoes.length,
        custo_tokens: parsed.custoEstimadoTokens,
      })
      .select("id")
      .single()
    jobId = (job as { id: string } | null)?.id ?? null
  } catch {
    // tabela pode não existir em dev sem migration — segue sem jobId
  }

  return NextResponse.json({
    jobId,
    fonte,
    fonteUrl,
    paginas: paginas || undefined,
    chunks: parsed.chunks,
    custoTokens: parsed.custoEstimadoTokens,
    questoes: parsed.questoes,
  })
}
