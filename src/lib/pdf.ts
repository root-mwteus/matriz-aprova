// Renderização de PDF no navegador (pdfjs) + recorte de regiões como imagem.
// Usado pelo extrator de questões: cada página vira uma imagem que é
// enviada à IA e também serve de fonte para recortar figuras.

export interface PageImage {
  pageNumber: number
  /** dataURL (JPEG) da página renderizada */
  dataUrl: string
  width: number
  height: number
}

export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

let workerConfigured = false

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist")
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs"
    workerConfigured = true
  }
  return pdfjs
}

/** Conta as páginas do PDF sem renderizá-las (rápido — usado para estimativas). */
export async function countPdfPages(file: File): Promise<number> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const count = pdf.numPages
  void pdf.cleanup()
  return count
}

/**
 * Renderiza páginas do PDF em imagens.
 * `startPage`/`endPage` são 1-based e inclusivos (padrão: todas as páginas).
 * `onPage` é chamado a cada página pronta (para progresso incremental).
 */
export async function renderPdfToPages(
  file: File,
  scale = 2,
  onPage?: (page: PageImage, total: number) => void,
  startPage = 1,
  endPage?: number,
): Promise<PageImage[]> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const lastPage = Math.min(endPage ?? pdf.numPages, pdf.numPages)
  const first = Math.max(1, startPage)
  const total = Math.max(0, lastPage - first + 1)
  const pages: PageImage[] = []

  for (let i = first; i <= lastPage; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement("canvas")
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvas, viewport }).promise
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    const pageImage: PageImage = { pageNumber: i, dataUrl, width: canvas.width, height: canvas.height }
    pages.push(pageImage)
    onPage?.(pageImage, total)
    page.cleanup()
  }

  return pages
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Recorta uma região (em coordenadas naturais da imagem) e devolve um PNG. */
export async function cropImage(dataUrl: string, rect: CropRect): Promise<Blob> {
  const img = await loadImage(dataUrl)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(rect.w))
  canvas.height = Math.max(1, Math.round(rect.h))
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), "image/png")
  })
}
