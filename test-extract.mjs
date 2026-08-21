import { readFileSync } from "node:fs"
try { process.loadEnvFile(".env") } catch {}
import { extrairTextoDePdf } from "./src/lib/importar-questoes/extract-pdf.ts"
const buf = readFileSync("provas/sinteticas/concursos/prova-04-direito-civil-cesgranrio-2020.pdf")
const r = await extrairTextoDePdf(buf)
console.log("paginas", r.paginas)
console.log(r.texto.slice(0, 900).replace(/\n/g, "\\n"))
