import { readFileSync } from "node:fs"
try { process.loadEnvFile(".env") } catch {}
import { extrairTextoDePdf } from "./src/lib/importar-questoes/extract-pdf.ts"
const buf = readFileSync("provas/sinteticas/concursos/prova-04-direito-civil-cesgranrio-2020.pdf")
const { texto } = await extrairTextoDePdf(buf)
console.log("texto head", texto.slice(0,500).replace(/\n/g,"\\n"))
const blocos = texto.split(/QUEST[ÃA]O\s+\d+\s*[—\-–]*/i)
console.log("blocos", blocos.length)
if (blocos[1]) {
  console.log("bloco1", blocos[1].slice(0, 600).replace(/\n/g,"\\n"))
  const linhas = blocos[1].split("\n").map(s=>s.trim()).filter(Boolean)
  console.log("linhas", linhas.slice(0,10))
  // test regex
  for (const l of linhas) {
    if (/^[A-E]\)/.test(l)) console.log("alt match", l.slice(0,40))
    if (/^Gabarito:/i.test(l)) console.log("gab match", l)
  }
}
