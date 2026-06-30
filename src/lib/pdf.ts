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
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    workerConfigured = true
  }
  return pdfjs
}

/**
 * Renderiza todas as páginas do PDF em imagens.
 * `onPage` é chamado a cada página pronta (para progresso incremental).
 */
export async function renderPdfToPages(
  file: File,
  scale = 2,
  onPage?: (page: PageImage, total: number) => void
): Promise<PageImage[]> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const total = pdf.numPages
  const pages: PageImage[] = []

  for (let i = 1; i <= total; i++) {
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
