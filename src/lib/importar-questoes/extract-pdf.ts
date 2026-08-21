import { createRequire } from "node:module"

// pdfjs-dist 3.x em Node: precisa desativar worker e usar build legado.
// O package não expõe `pdfjs-dist/legacy/build/pdf.js` em ESM puro sem `createRequire`.
export async function extrairTextoDePdf(buffer: Buffer): Promise<{ texto: string; paginas: number }> {
  const requireFn = createRequire(import.meta.url)
  // pdfjs legacy build só via require (sem ESM)
  const pdfjs = (requireFn as unknown as (id: string) => typeof import("pdfjs-dist"))("pdfjs-dist/legacy/build/pdf.js")

  const doc = await pdfjs.getDocument({ data: buffer, disableWorker: true } as unknown as Parameters<typeof pdfjs.getDocument>[0]).promise
  const paginas = doc.numPages
  const textos: string[] = []

  for (let i = 1; i <= paginas; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const linhas = content.items
      .map((item) => ("str" in item ? (item.str as string) : ""))
      .join(" ")
    textos.push(linhas)
    page.cleanup()
  }
  await doc.destroy()

  // Remove cabeçalho/rodapé repetido (linha que aparece em >80% das páginas)
  const semRepetido = removerCabecalhoRepetido(textos)

  const texto = semRepetido.join("\n\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  return { texto, paginas }
}

function removerCabecalhoRepetido(paginas: string[]): string[] {
  if (paginas.length < 3) return paginas
  const freq = new Map<string, number>()
  for (const p of paginas) {
    for (const linha of p.split("\n").map((l) => l.trim()).filter(Boolean)) {
      freq.set(linha, (freq.get(linha) ?? 0) + 1)
    }
  }
  const repetidas = new Set(Array.from(freq.entries()).filter(([, n]) => n / paginas.length > 0.8).map(([l]) => l))
  if (!repetidas.size) return paginas
  return paginas.map((p) =>
    p
      .split("\n")
      .filter((l) => !repetidas.has(l.trim()))
      .join("\n"),
  )
}
