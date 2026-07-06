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
  model: z.enum(["gpt-4o", "gpt-4o-mini"]).default("gpt-4o-mini"),
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
          figuras_bbox: {
            type: "array",
            description: "Caixa delimitadora de cada figura em figuras_descricao como fração da página (0.0–1.0). Mesma ordem e mesmo tamanho que figuras_descricao. Array vazio se sem figuras.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                x: { type: "number", description: "Borda esquerda, 0.0–1.0" },
                y: { type: "number", description: "Borda superior, 0.0–1.0" },
                w: { type: "number", description: "Largura, 0.0–1.0" },
                h: { type: "number", description: "Altura, 0.0–1.0" },
              },
              required: ["x", "y", "w", "h"],
            },
          },
          completa: {
            type: "boolean",
            description: "true se enunciado e alternativas estão legíveis e completos. false APENAS se falta parte do enunciado, falta alguma alternativa, ou o texto-base está cortado. NÃO marque false só porque há figura — figuras são recortadas automaticamente.",
          },
          aviso: {
            type: ["string", "null"],
            description: "Se completa=false, explique o que falta (ex.: 'alternativas D e E cortadas', 'texto-base incompleto'). Senão null.",
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
          "figuras_bbox",
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

Enunciado — regras estritas:
- Transcreva o enunciado INTEGRALMENTE, sem resumir, encurtar ou cortar.
- REMOVA o identificador numérico da questão ("Questão 45", "QUESTÃO 45", "45.", "45 -", etc.). O enunciado começa no primeiro caractere do texto da pergunta, NUNCA com o número ou rótulo da questão.
- NÃO inclua as alternativas dentro do enunciado. O campo "enunciado" termina antes da linha que começa com "A)", "A.", "(A)", ou equivalentes. As alternativas vão APENAS no array "alternativas".
- NÃO repita no enunciado nenhum trecho que já está em "texto_referencia".

Alternativas:
- "alternativas": array de strings na ordem A, B, C, D, E — apenas o texto de cada alternativa, SEM a letra identificadora (não coloque "A)", "B)" etc.).
- "resposta_correta": índice 0-based; null se o gabarito não estiver visível.

Texto de referência — regras estritas:
- "texto_referencia" é EXCLUSIVAMENTE um texto-base externo à questão: crônica, poema, notícia, artigo, trecho de lei, tabela ou charge COM texto que serve de base para interpretar. Só existe quando a prova apresenta explicitamente um bloco de texto ANTES ou separado do enunciado da questão.
- Se o bloco de texto ANTECEDE múltiplas questões, copie-o integralmente em cada uma delas.
- NÃO use "texto_referencia" para o enunciado da própria questão, nem para trechos do enunciado. Se a questão não tem texto-base externo, use null.
- Critério prático: se remover o "texto_referencia" e a questão ainda fizer sentido completo, então não era um texto de referência — use null.

Fórmulas:
- Matemáticas/químicas/físicas SEMPRE em LaTeX: $...$ para inline e $$...$$ para destaque. NÃO use \\( \\) nem \\[ \\].
- Use APENAS comandos KaTeX: \\frac{}{}, \\sqrt{}, \\sum, \\int, \\lim, \\infty, \\pm, \\times, \\cdot, \\leq, \\geq, \\neq, \\approx, ^{}, _{}, \\left(, \\right), letras gregas. NÃO invente comandos — use Unicode se necessário (ex.: ±).

Demais campos:
- "explicacao": comentário do gabarito se houver; senão uma explicação correta e concisa.
- "referencias": base legal/doutrinária se identificável; senão null.
- "materia": classifique (ex.: "Direito Constitucional", "Matemática", "Português").
- "figuras_descricao": descreva cada figura/gráfico/diagrama/mapa que faça parte da questão. Sem figura → array vazio.
- "figuras_bbox": para cada figura em figuras_descricao, estime a caixa delimitadora como fração da imagem da página (0.0 = esquerda/topo, 1.0 = direita/base): {"x": borda esquerda, "y": borda superior, "w": largura, "h": altura}. Mesmo número de elementos que figuras_descricao. Array vazio se sem figuras.

Auto-revisão de completude:
- "completa": marque false APENAS se faltar parte do enunciado, faltar alternativa, ou o texto-base estiver cortado. NÃO marque false por causa de figuras — elas são recortadas automaticamente via figuras_bbox.
- "aviso": se completa=false, diga objetivamente o que falta no texto ou alternativas. Senão null.

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
    const { page_image, next_page_image, page_number, model } = parsed.data

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
      model,
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
