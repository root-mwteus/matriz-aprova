import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const MATERIAS = ["Português","Matemática","Direito Constitucional","Direito Administrativo","Informática","Raciocínio Lógico","História","Geografia","Atualidades","Legislação","Direito Penal","Direito Civil"]
const BANCAS = ["CESPE/CEBRASPE","FGV","VUNESP","FCC","IBFC","CONSULPLAN","QUADRIX","CESGRANRIO"]
const NIVEIS = ["fácil","médio","difícil"]
const AREAS = ["concursos","oab","militar","enem"]

function rand(arr) { return arr[Math.floor(Math.random()*arr.length)] }

const ENUNCIADOS = [
  "Com base no art. 5º da Constituição Federal, assinale a alternativa correta.",
  "Acerca dos princípios da Administração Pública, julgue a assertiva a seguir.",
  "Considerando a Lei nº 8.112/90, analise a situação hipotética apresentada.",
  "Em relação à interpretação de texto, assinale a alternativa que apresenta a análise correta.",
  "Sobre proposições lógicas e conectivos, marque a alternativa correta.",
  "A respeito de segurança da informação, assinale a opção correta.",
  "Com relação a princípios fundamentais, assinale a alternativa correta.",
  "Sobre a equação patrimonial, indique a alternativa que reflete corretamente o conceito.",
]

async function gerarProva(idx, materia, banca, ano, nivel, area) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  let page = pdf.addPage([595, 842])
  let y = 800
  const margin = 40
  const maxY = 40

  function novaPagina() {
    page = pdf.addPage([595, 842])
    y = 800
  }
  function texto(t, opts={}) {
    const size = opts.size || 9
    const f = opts.bold ? bold : font
    const lines = t.split("\n")
    for (const line of lines) {
      const width = f.widthOfTextAtSize(line, size)
      // quebra simples se passar da largura
      if (width > 515) {
        const palavras = line.split(" ")
        let linha = ""
        for (const p of palavras) {
          const teste = linha ? linha + " " + p : p
          if (f.widthOfTextAtSize(teste, size) > 515) {
            if (y < maxY+20) { novaPagina() }
            page.drawText(linha, { x: margin, y, size, font: f })
            y -= size+4
            linha = p
          } else linha = teste
        }
        if (linha) {
          if (y < maxY+20) { novaPagina() }
          page.drawText(linha, { x: margin, y, size, font: f })
          y -= size+4
        }
      } else {
        if (y < maxY+10) { novaPagina() }
        page.drawText(line, { x: margin, y, size, font: f })
        y -= size+5
      }
    }
  }

  texto(`${banca} — ${area.toUpperCase()} — ${ano} — Prova ${idx+1}`, {bold:true, size:10})
  texto(`${materia} — Nível: ${nivel} — 10 questões objetivas (A–E)`, {size:8})
  y -= 6
  texto("Instruções: marque a única alternativa correta para cada questão.", {size:7})
  y -= 4
  page.drawLine({ start:{x:margin,y}, end:{x:555,y}, thickness:0.5, color: rgb(0.8,0.8,0.8)})
  y -= 12

  for (let q=1; q<=10; q++) {
    const en = rand(ENUNCIADOS)
    if (y < 140) { novaPagina() }
    texto(`QUESTÃO ${q} — ${materia}`, {bold:true, size:8})
    texto(`${en} (${banca}, ${ano})`, {size:8})
    y -= 2
    for (const letra of ["A","B","C","D","E"]) {
      const alt = `Alternativa ${letra}: conteúdo da alternativa ${letra} para a questão ${q} de ${materia}.`
      texto(`${letra}) ${alt}`, {size:8})
    }
    texto(`Gabarito: ${["A","B","C","D","E"][Math.floor(Math.random()*5)]}`, {size:7})
    y -= 8
  }

  const bytes = await pdf.save()
  const nome = `prova-${String(idx+1).padStart(2,"0")}-${materia.toLowerCase().replace(/[^a-z]+/g,"-")}-${banca.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${ano}.pdf`
  const dir = join("provas", "sinteticas", area)
  mkdirSync(dir, {recursive:true})
  writeFileSync(join(dir, nome), bytes)
  console.log(`✓ ${nome}`)
}

const TOTAL = 44
for (let i=0; i<TOTAL; i++) {
  const materia = rand(MATERIAS)
  const banca = rand(BANCAS)
  const ano = 2020 + Math.floor(Math.random()*6) // 2020-2025
  const nivel = rand(NIVEIS)
  const area = rand(AREAS)
  await gerarProva(i, materia, banca, ano, nivel, area)
}
console.log(`\nGeradas ${TOTAL} provas sintéticas em provas/sinteticas/ (variadas por matéria/banca/ano/área)`)
