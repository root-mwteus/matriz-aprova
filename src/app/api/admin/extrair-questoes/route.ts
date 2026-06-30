import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"
import OpenAI from "openai"

// A extração pode demorar para PDFs grandes; aumenta o limite da função.
export const maxDuration = 300

const BodySchema = z.object({
  pdf_path: z.string().min(1, "pdf_path é obrigatório"),
})

// Schema de saída estruturada exigido da OpenAI (strict json_schema).
const questoesJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          enunciado: { type: "string" },
          alternativas: { type: "array", items: { type: "string" } },
          resposta_correta: {
            type: ["integer", "null"],
            description: "Índice (0-based) da alternativa correta, ou null se o gabarito não estiver no PDF",
          },
          explicacao: { type: ["string", "null"] },
          referencias: { type: ["string", "null"] },
          materia: { type: "string" },
          sub_materia: { type: ["string", "null"] },
          banca: { type: ["string", "null"] },
          ano: { type: ["integer", "null"] },
          area_concurso: { type: ["string", "null"] },
          figuras_descricao: {
            type: "array",
            items: { type: "string" },
            description: "Descrição de cada figura/gráfico/imagem que aparece na questão",
          },
        },
        required: [
          "enunciado",
          "alternativas",
          "resposta_correta",
          "explicacao",
          "referencias",
          "materia",
          "sub_materia",
          "banca",
          "ano",
          "area_concurso",
          "figuras_descricao",
        ],
      },
    },
  },
  required: ["questoes"],
} as const

const SYSTEM_PROMPT = `Você é um extrator de questões de provas de concursos públicos brasileiros.
Receberá o PDF de uma prova e deve identificar TODAS as questões de múltipla escolha.

Regras:
- Transcreva o enunciado e as alternativas EXATAMENTE como aparecem.
- Fórmulas matemáticas, químicas ou físicas DEVEM ser escritas em LaTeX: use $...$ para inline e $$...$$ para fórmulas em destaque. Ex.: "a raiz de $x^2 + 1$" ou "$$\\int_0^1 x\\,dx$$".
- "alternativas" é um array de strings, na ordem A, B, C, D, E (sem incluir a letra, só o texto).
- "resposta_correta" é o índice 0-based (A=0, B=1...). Se o gabarito NÃO estiver no PDF, use null.
- "explicacao": se a prova trouxer comentário/justificativa do gabarito, transcreva; senão escreva uma explicação correta e concisa de por que a alternativa está certa. Pode usar LaTeX.
- "referencias": base legal ou doutrinária quando identificável (ex.: "Lei 8.666/93, art. 23"); senão null.
- "materia": classifique (ex.: "Direito Constitucional", "Matemática", "Português").
- "figuras_descricao": para cada imagem/gráfico/diagrama que faça parte da questão, descreva o que ela mostra. Se não houver figura, retorne array vazio.
- Ignore capa, instruções, folha de respostas em branco e rodapés. Extraia apenas questões reais.`

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: "", ...options }) } catch {}
        },
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada no servidor" },
        { status: 500 }
      )
    }

    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { pdf_path } = parsed.data

    const supabase = getSupabase()

    // 1. Autenticação + checagem de papel admin (server-side, não confiar só no middleware)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    // 2. Download do PDF do Storage
    const { data: file, error: downloadError } = await supabase.storage
      .from("pdf-provas")
      .download(pdf_path)
    if (downloadError || !file) {
      console.error("Erro ao baixar PDF:", downloadError)
      return NextResponse.json({ error: "Não foi possível ler o PDF enviado" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const dataUrl = `data:application/pdf;base64,${base64}`

    // 3. Chamada à OpenAI Responses API com o PDF nativo
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Extraia todas as questões deste PDF de prova." },
            { type: "input_file", filename: pdf_path.split("/").pop() || "prova.pdf", file_data: dataUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "questoes_extraidas",
          schema: questoesJsonSchema,
          strict: true,
        },
      },
    })

    const raw = response.output_text
    if (!raw) {
      return NextResponse.json({ error: "A IA não retornou questões" }, { status: 502 })
    }

    let questoes
    try {
      questoes = JSON.parse(raw).questoes
    } catch (e) {
      console.error("Resposta da IA não é JSON válido:", raw)
      return NextResponse.json({ error: "Falha ao interpretar a resposta da IA" }, { status: 502 })
    }

    return NextResponse.json({ questoes })
  } catch (err) {
    console.error("Erro ao extrair questões:", err)
    const msg = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao extrair questões: " + msg }, { status: 500 })
  }
}
