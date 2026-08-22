import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { caminhoFiguraCosseno, extrairGabaritoCosseno, extrairIdOriginalCosseno, normalizarQuestaoCosseno, urlsIneditasCosseno } from "./importar-cosseno-lib.mjs"

const ORIGEM = "https://cosseno.com/questoes"
const DISCIPLINAS = ["Matemática", "Física", "Química", "Biologia", "Geografia", "História", "Português", "Redação", "Inglês", "Filosofia", "Espanhol", "Artes", "Sociologia"]
const ESPERA_MS = 650
const limiteArg = process.argv.find((arg) => arg.startsWith("--limit="))
const LIMITE = limiteArg ? Number(limiteArg.split("=")[1]) : Number.POSITIVE_INFINITY
const DRY_RUN = process.argv.includes("--dry-run")
const REINICIAR = process.argv.includes("--fresh")
const NOME_ESTADO = DRY_RUN ? "cosseno-test.json" : "cosseno.json"
const CAMINHO_ESTADO = join(process.cwd(), "scripts", ".state", NOME_ESTADO)

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function carregarEstado() {
  try {
    return JSON.parse(await readFile(CAMINHO_ESTADO, "utf8"))
  } catch {
    return { processados: [], erros: [] }
  }
}

async function salvarEstado(estado) {
  await mkdir(join(process.cwd(), "scripts", ".state"), { recursive: true })
  await writeFile(CAMINHO_ESTADO, JSON.stringify(estado, null, 2))
}

function carregarEnv() {
  try { process.loadEnvFile(join(process.cwd(), ".env")) } catch {}
}

function clienteSupabase() {
  carregarEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function selecionarDisciplina(page, disciplina) {
  await page.goto(ORIGEM, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Disciplina", exact: true }).click()
  await page.getByRole("option", { name: disciplina, exact: true }).click()
  await page.getByRole("button", { name: "BUSCAR", exact: true }).click()
  await page.waitForSelector('a[href^="/q/"]', { timeout: 15_000 })
}

async function* descobrirLotes(page, disciplina, limite) {
  await selecionarDisciplina(page, disciplina)
  const vistas = new Set()
  let semNovas = 0

  while (vistas.size < limite && semNovas < 3) {
    const encontradas = await page.locator('a[href^="/q/"]').evaluateAll((links) => links.map((link) => link.href))
    const novas = urlsIneditasCosseno(encontradas, vistas).slice(0, limite - (vistas.size - encontradas.length))
    if (novas.length) {
      semNovas = 0
      console.log(`[${disciplina}] ${vistas.size} URL(s) descobertas; iniciando lote de ${novas.length}.`)
      yield novas
    } else {
      semNovas++
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await esperar(ESPERA_MS)
  }
}

async function extrairQuestao(page, url) {
  const idOriginal = extrairIdOriginalCosseno(url)
  if (!idOriginal) throw new Error("URL de questão sem ID público")

  await page.goto(url, { waitUntil: "domcontentloaded" })
  await page.waitForSelector('[role="radiogroup"]', { timeout: 15_000 })
  await esperar(350)

  const base = await page.evaluate(() => {
    const main = document.querySelector("main")
    const grupo = main?.querySelector('[role="radiogroup"]')
    const texto = (element) => element?.innerText?.replace(/\s+/g, " ").trim() ?? ""
    const metadados = [...(main?.querySelectorAll('a') ?? [])].map((link) => ({
      texto: texto(link),
      href: new URL(link.href, location.origin).pathname,
    }))
    const alternativas = [...(grupo?.querySelectorAll('input[type="radio"]') ?? [])]
      .map((radio) => texto(radio.closest(".v-radio")?.querySelector("label")))
    const paragrafos = [...(main?.querySelectorAll("p") ?? [])].map(texto).filter(Boolean)
    const imagens = [...(main?.querySelectorAll("img[src]") ?? [])]
      .filter((imagem) => !/cosseno/i.test(imagem.alt ?? ""))
      .map((imagem) => imagem.src)

    return { metadados, alternativas, enunciado: paragrafos[0] ?? "", imagens }
  })

  const prova = base.metadados.find((item) => item.href.startsWith("/provas-anteriores/"))?.texto ?? null
  const anoTexto = base.metadados.find((item) => /^\/questoes\/[^/]+\/\d{4}$/.test(item.href))?.texto ?? ""
  const materia = base.metadados.find((item) => /^\/questoes\/[^/]+\/\d{4}\//.test(item.href))?.texto ?? null

  const dados = page.getByRole("button", { name: "Dados", exact: true })
  if (await dados.count()) await dados.click()
  const detalhes = await page.locator("body").innerText()
  const dificuldade = detalhes.match(/Dificuldade:\s*(Fácil|Média|Médio|Difícil)/i)?.[1] ?? null

  const assuntosBotao = page.getByRole("button", { name: "Assuntos", exact: true })
  if (await assuntosBotao.count()) await assuntosBotao.first().click()
  const assuntos = await page.locator('a[href*="assuntos="]').allTextContents()

  const formulaPngs = []
  const formulas = await page.locator("main .katex").all()
  for (const formula of formulas.slice(0, 20)) {
    try { formulaPngs.push(await formula.screenshot({ type: "png" })) } catch {}
  }

  await esperar(ESPERA_MS)
  await page.goto(`https://cosseno.com/r/${idOriginal}`, { waitUntil: "domcontentloaded" })
  const resolucao = await page.locator("body").innerText()
  const respostaCorreta = extrairGabaritoCosseno(resolucao)

  return {
    idOriginal,
    url,
    materia,
    prova,
    ano: Number(anoTexto) || null,
    dificuldade,
    assuntos,
    enunciado: base.enunciado,
    alternativas: base.alternativas,
    respostaCorreta,
    imagens: base.imagens,
    formulaPngs,
  }
}

async function enviarFiguras(supabase, questao, formulaPngs) {
  const figuras = []
  for (const [indice, url] of questao.imagens_origem.entries()) {
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      const contentType = resposta.headers.get("content-type")?.split(";")[0] || "image/png"
      if (!contentType.startsWith("image/")) throw new Error(`tipo inválido: ${contentType}`)
      const caminho = caminhoFiguraCosseno(questao.fonte_id_original, "imagem", indice + 1, contentType)
      const { error } = await supabase.storage.from("questoes-figuras").upload(caminho, await resposta.arrayBuffer(), { contentType, upsert: true })
      if (error) throw new Error(error.message)
      figuras.push({ id: `imagem-${indice + 1}`, storage_path: caminho, legenda: "Imagem da questão" })
    } catch (error) {
      console.warn(`Imagem ignorada em ${questao.fonte_id_original}: ${error instanceof Error ? error.message : error}`)
    }
  }
  for (const [indice, png] of formulaPngs.entries()) {
    try {
      const caminho = caminhoFiguraCosseno(questao.fonte_id_original, "formula", indice + 1, "image/png")
      const { error } = await supabase.storage.from("questoes-figuras").upload(caminho, png, { contentType: "image/png", upsert: true })
      if (error) throw new Error(error.message)
      figuras.push({ id: `formula-${indice + 1}`, storage_path: caminho, legenda: "Fórmula renderizada da questão" })
    } catch (error) {
      console.warn(`Fórmula ignorada em ${questao.fonte_id_original}: ${error instanceof Error ? error.message : error}`)
    }
  }
  return figuras
}

async function main() {
  if (!Number.isFinite(LIMITE) && DRY_RUN) throw new Error("O modo de teste precisa de --limit")
  const estado = REINICIAR ? { processados: [], erros: [] } : await carregarEstado()
  const processados = new Set(estado.processados)
  const supabase = DRY_RUN ? null : clienteSupabase()
  const browser = await chromium.launch({ headless: true })
  const pageLista = await browser.newPage()
  const pageQuestao = await browser.newPage()
  let coletadas = 0
  let salvas = 0
  let tentadas = 0

  try {
    for (const disciplina of DISCIPLINAS) {
      if (DRY_RUN && tentadas >= LIMITE) break
      const limiteDisciplina = DRY_RUN ? LIMITE - tentadas : LIMITE - coletadas
      for await (const urls of descobrirLotes(pageLista, disciplina, limiteDisciplina)) {
        for (const url of urls) {
          if ((DRY_RUN && tentadas >= LIMITE) || (!DRY_RUN && coletadas >= LIMITE)) break
          const idOriginal = extrairIdOriginalCosseno(url)
          if (!idOriginal || processados.has(idOriginal)) continue

          try {
            tentadas++
            const bruta = await extrairQuestao(pageQuestao, url)
            if (DRY_RUN) {
              const { formulaPngs, ...amostra } = bruta
              console.log("Amostra coletada:", JSON.stringify({ ...amostra, formulasRenderizadas: formulaPngs.length }, null, 2))
            }
            const normalizada = normalizarQuestaoCosseno(bruta)
            if (!normalizada.ok) throw new Error(normalizada.erro)

            coletadas++
            console.log(JSON.stringify(normalizada.questao, null, 2))
            if (supabase) {
              normalizada.questao.figuras = await enviarFiguras(supabase, normalizada.questao, bruta.formulaPngs)
              const { error } = await supabase.from("questions").upsert(normalizada.questao, { onConflict: "codigo_importacao" })
              if (error) throw new Error(error.message)
              salvas++
            }
            processados.add(idOriginal)
            estado.processados = [...processados]
            await salvarEstado(estado)
            console.log(`[${coletadas}/${Number.isFinite(LIMITE) ? LIMITE : "∞"}] ${DRY_RUN ? "validada" : "salva"}: ${idOriginal}`)
          } catch (error) {
            const mensagem = error instanceof Error ? error.message : String(error)
            estado.erros.push({ idOriginal, url, erro: mensagem, em: new Date().toISOString() })
            processados.add(idOriginal)
            estado.processados = [...processados]
            await salvarEstado(estado)
            console.error(`Erro em ${url}: ${mensagem}`)
          }
          await esperar(ESPERA_MS)
        }
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`\nConcluído: ${tentadas} tentadas, ${coletadas} válidas, ${salvas} salvas, ${estado.erros.length} erro(s). Estado: ${CAMINHO_ESTADO}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
