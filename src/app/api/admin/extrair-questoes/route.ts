import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"
import OpenAI from "openai"

export const maxDuration = 120

const BodySchema = z.object({
  page_image: z.string().min(1).startsWith("data:image/"),
  next_page_image: z.string().startsWith("data:image/").optional(),
  page_number: z.number().int().positive(),
})

// Saída estruturada exigida da OpenAI (strict json_schema).
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
          enunciado: { type: "string", description: "Enunciado COMPLETO da questão, sem cortes nem resumo" },
          texto_referencia: {
            type: ["string", "null"],
            description: "Texto-base/motivador que a questão exige para ser respondida (interpretação, poema, gráfico textual, lei citada). null se a questão não depender de um texto externo.",
          },
          alternativas: { type: "array", items: { type: "string" } },
          resposta_correta: {
            type: ["integer", "null"],
            description: "Índice (0-based) da alternativa correta; null se o gabarito não estiver visível",
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
            description: "Descrição de cada figura/gráfico/imagem/mapa que faz parte da questão",
          },
          completa: {
            type: "boolean",
            description: "true se a questão parece COMPLETA (enunciado + alternativas legíveis; se houver figura, ela é parte separada que o admin anexa). false se algo essencial está faltando/cortado.",
          },
          aviso: {
            type: ["string", "null"],
            description: "Se completa=false, explique o que falta (ex.: 'alternativas D e E cortadas', 'depende de figura', 'texto-base incompleto'). Senão null.",
          },
        },
        required: [
          "enunciado",
          "texto_referencia",
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
          "completa",
          "aviso",
        ],
      },
    },
  },
  required: ["questoes"],
} as const

const SYSTEM_PROMPT = `Você é um extrator de questões de provas de concursos públicos brasileiros.
Você recebe a IMAGEM de uma página da prova (a "página atual"). Às vezes recebe TAMBÉM a imagem da página SEGUINTE, apenas como contexto.

REGRA DE OURO (evita duplicação e cortes entre páginas):
- Extraia SOMENTE as questões que COMEÇAM na página atual (a primeira imagem).
- Se uma questão começa na página atual e CONTINUA na página seguinte (alternativas ou enunciado que transbordam), use a segunda imagem para transcrever a questão COMPLETA.
- NÃO extraia questões que começam na página seguinte — elas serão extraídas depois.

Transcrição:
- Transcreva o enunciado e as alternativas INTEGRALMENTE, sem resumir, encurtar ou cortar. Se o texto é longo, copie tudo.
- Fórmulas matemáticas/químicas/físicas SEMPRE em LaTeX, usando APENAS estes delimitadores: $...$ para inline e $$...$$ para destaque. NÃO use \\( \\) nem \\[ \\]. Ex.: "a raiz de $x^2+1$" e "$$\\int_0^1 x\\,dx$$".
- Use APENAS comandos LaTeX suportados pelo KaTeX. Exemplos válidos: \\frac{}{}, \\sqrt{}, \\sum, \\int, \\lim, \\infty, \\pm, \\times, \\cdot, \\leq, \\geq, \\neq, \\approx, ^{}, _{}, \\left(, \\right), \\alpha, \\beta, \\gamma, \\delta, \\theta, \\lambda, \\mu, \\nu, \\pi, \\sigma, \\phi, \\psi, \\omega, \\Gamma, \\Delta, \\Sigma, \\Omega. NÃO invente comandos — se não sabe o comando exato de um símbolo, use o Unicode diretamente (ex.: ± em vez de tentar inventar um comando).
- "alternativas": array de strings na ordem A, B, C, D, E (só o texto, sem a letra).
- "resposta_correta": índice 0-based; null se o gabarito não estiver visível.
- "texto_referencia": questões de Português/Línguas/Interpretação/Atualidades costumam depender de um TEXTO-BASE (crônica, poema, charge com texto, artigo, trecho de lei). Transcreva esse texto-base aqui INTEGRALMENTE. Se vários itens compartilham o mesmo texto, repita-o em cada questão. Se a questão não depende de texto externo, use null.
- "explicacao": transcreva o comentário do gabarito se houver; senão escreva uma explicação correta e concisa (pode usar LaTeX).
- "referencias": base legal/doutrinária se identificável; senão null.
- "materia": classifique (ex.: "Direito Constitucional", "Matemática", "Português").
- "figuras_descricao": descreva cada figura/gráfico/diagrama/mapa que faça parte da questão. Sem figura → array vazio.

Auto-revisão de completude:
- "completa": marque false se faltar parte do enunciado, faltar alternativa, o texto-base estiver cortado, ou se a questão claramente depende de uma figura para ser respondida. Considere a figura como item à parte (o admin vai anexá-la), mas SINALIZE quando ela é indispensável.
- "aviso": se completa=false, diga objetivamente o que falta. Senão null.

Se a página atual não tiver nenhuma questão que comece nela, retorne "questoes": [].`

// In-memory rate limit por instância serverless (MVP — trocar por Upstash Redis em produção)
const _limites = new Map<string, { count: number; resetAt: number }>()
const LIMITE_POR_HORA = 60

function checarLimite(userId: string): boolean {
  const agora = Date.now()
  const entrada = _limites.get(userId)
  if (!entrada || agora > entrada.resetAt) {
    _limites.set(userId, { count: 1, resetAt: agora + 60 * 60 * 1000 })
    return true
  }
  if (entrada.count >= LIMITE_POR_HORA) return false
  entrada.count++
  return true
}

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
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada no servidor" }, { status: 500 })
    }

    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { page_image, next_page_image, page_number } = parsed.data

    const supabase = getSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    if (!checarLimite(user.id)) {
      return NextResponse.json({ error: "Limite de 60 páginas por hora atingido." }, { status: 429 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const content: OpenAI.Responses.ResponseInputMessageContentList = [
      {
        type: "input_text",
        text: next_page_image
          ? `Página atual: nº ${page_number} (1ª imagem). A 2ª imagem é a página seguinte, apenas como contexto para completar questões que transbordam. Extraia só as questões que COMEÇAM na página ${page_number}.`
          : `Página atual: nº ${page_number} (última do documento). Extraia as questões que começam nela.`,
      },
      { type: "input_image", image_url: page_image, detail: "high" },
    ]
    if (next_page_image) {
      content.push({ type: "input_image", image_url: next_page_image, detail: "high" })
    }

    const response = await openai.responses.create({
      model: "gpt-4o",
      max_output_tokens: 8000,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
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
    if (!raw) return NextResponse.json({ error: "A IA não retornou dados" }, { status: 502 })

    let questoes
    try {
      questoes = JSON.parse(raw).questoes
    } catch {
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
