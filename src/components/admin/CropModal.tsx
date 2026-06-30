"use client"

import { useRef, useState } from "react"
import { cropImage, type PageImage, type CropRect } from "@/lib/pdf"

interface Props {
  pages: PageImage[]
  initialPage: number
  onCancel: () => void
  onCropped: (blob: Blob) => void
}

interface DragRect {
  x: number
  y: number
  w: number
  h: number
}

export function CropModal({ pages, initialPage, onCancel, onCropped }: Props) {
  const idxInicial = Math.max(0, pages.findIndex((p) => p.pageNumber === initialPage))
  const [idx, setIdx] = useState(idxInicial === -1 ? 0 : idxInicial)
  const [rect, setRect] = useState<DragRect | null>(null)
  const [dragging, setDragging] = useState(false)
  const [recortando, setRecortando] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const page = pages[idx]

  function localPos(e: React.MouseEvent) {
    const el = imgRef.current!
    const r = el.getBoundingClientRect()
    return {
      x: Math.min(Math.max(0, e.clientX - r.left), r.width),
      y: Math.min(Math.max(0, e.clientY - r.top), r.height),
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    const p = localPos(e)
    startRef.current = p
    setRect({ x: p.x, y: p.y, w: 0, h: 0 })
    setDragging(true)
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !startRef.current) return
    const p = localPos(e)
    const s = startRef.current
    setRect({
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    })
  }

  function onMouseUp() {
    setDragging(false)
  }

  function trocarPagina(novoIdx: number) {
    setIdx(novoIdx)
    setRect(null)
  }

  async function confirmar() {
    if (!rect || rect.w < 5 || rect.h < 5 || !imgRef.current) return
    setRecortando(true)
    // Mapeia da imagem exibida (CSS) para os pixels naturais da página.
    const el = imgRef.current
    const escala = page.width / el.clientWidth
    const natural: CropRect = {
      x: rect.x * escala,
      y: rect.y * escala,
      w: rect.w * escala,
      h: rect.h * escala,
    }
    try {
      const blob = await cropImage(page.dataUrl, natural)
      onCropped(blob)
    } finally {
      setRecortando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card border border-[#2A2A2A] rounded-card w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div>
            <h3 className="text-sm font-bold text-foreground">Recortar figura do PDF</h3>
            <p className="text-[11px] text-muted">Arraste para desenhar um retângulo sobre a figura.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => trocarPagina(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="text-xs px-2 py-1 rounded border border-[#2A2A2A] text-muted hover:text-foreground disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-xs text-muted font-mono">pág {page.pageNumber}/{pages.length}</span>
            <button
              onClick={() => trocarPagina(Math.min(pages.length - 1, idx + 1))}
              disabled={idx === pages.length - 1}
              className="text-xs px-2 py-1 rounded border border-[#2A2A2A] text-muted hover:text-foreground disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>

        {/* Área da imagem */}
        <div className="flex-1 overflow-auto p-4 flex justify-center bg-[#0D0D0D]">
          <div
            className="relative inline-block select-none cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={page.dataUrl}
              alt={`Página ${page.pageNumber}`}
              draggable={false}
              className="max-w-full h-auto block"
            />
            {rect && (
              <div
                className="absolute border-2 border-accent bg-accent/20 pointer-events-none"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              />
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2A2A2A]">
          <button onClick={onCancel} className="text-xs text-muted hover:text-foreground px-4 py-2">
            CANCELAR
          </button>
          <button
            onClick={confirmar}
            disabled={!rect || rect.w < 5 || rect.h < 5 || recortando}
            className="text-xs bg-accent text-accent-foreground font-bold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {recortando ? "RECORTANDO..." : "USAR ESTE RECORTE →"}
          </button>
        </div>
      </div>
    </div>
  )
}
