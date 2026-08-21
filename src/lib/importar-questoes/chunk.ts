import { createHash } from "node:crypto"

// Chunking do extrator.md: 8k chars com overlap 500 para não cortar questão no meio.
// Dedupe por Jaccard >0.92 no enunciado para remover repetidas entre chunks.

export const CHUNK_SIZE = 8000
export const CHUNK_OVERLAP = 500

export function chunkTexto(texto: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (texto.length <= size) return [texto]
  const chunks: string[] = []
  let start = 0
  while (start < texto.length) {
    const end = Math.min(start + size, texto.length)
    chunks.push(texto.slice(start, end))
    if (end >= texto.length) break
    start = end - overlap
  }
  return chunks
}

function tokenizar(texto: string): Set<string> {
  return new Set(
    texto
      .toLowerCase()
      .replace(/[^a-z0-9\u00c0-\u024f]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const w of Array.from(a)) if (b.has(w)) inter++
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

export function dedupePorEnunciado<T extends { enunciado: string }>(questoes: T[], limiar = 0.92): T[] {
  const keep: T[] = []
  const tokens = questoes.map((q) => tokenizar(q.enunciado))
  for (let i = 0; i < questoes.length; i++) {
    let dup = false
    for (let j = 0; j < keep.length; j++) {
      const idxKeep = questoes.indexOf(keep[j]!)
      if (jaccard(tokens[i]!, tokens[idxKeep]!) > limiar) {
        dup = true
        break
      }
    }
    if (!dup) keep.push(questoes[i]!)
  }
  return keep
}

export function hashFonte(fonte: string): string {
  return createHash("sha1").update(fonte).digest("hex").slice(0, 8)
}
