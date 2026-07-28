"use client"

import { useRef, useState, type DragEvent } from "react"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { IconButton } from "@/components/ui"

/**
 * Área de upload.
 *
 * Três correções sobre a versão anterior:
 * · era uma `div` clicável — invisível para o teclado. Agora é um botão
 *   de verdade, acionável por Enter/Espaço;
 * · o arquivo escolhido não podia ser removido sem recarregar a página;
 * · a borda tracejada grossa dominava o formulário. Ficou de 1px, com o
 *   destaque reservado ao momento do arraste, onde ele informa algo.
 */

interface UploadZoneProps {
  onFile: (file: File) => void
  accept?: string
  /** Rótulo do que se espera receber — evita o genérico "arraste aqui". */
  label?: string
  maxSizeMB?: number
}

export function UploadZone({ onFile, accept = ".pdf", label = "Arraste o PDF ou clique para selecionar", maxSizeMB }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function accept_(f: File) {
    if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
      setError(`Arquivo acima de ${maxSizeMB} MB`)
      return
    }
    setError(null)
    setFile(f)
    onFile(f)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) accept_(f)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-ink">
          <FileText size={15} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{file.name}</p>
          <p className="text-xs tabular-nums text-fg-subtle">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <IconButton
          label="Remover arquivo"
          variant="ghost"
          size="sm"
          onClick={() => {
            setFile(null)
            if (inputRef.current) inputRef.current.value = ""
          }}
        >
          <X size={15} strokeWidth={2} />
        </IconButton>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8",
          "transition-colors duration-DEFAULT",
          dragging
            ? "border-accent-ink bg-accent-soft"
            : "border-line-strong bg-surface-sunken hover:border-fg-faint hover:bg-surface-hover"
        )}
      >
        <Upload size={17} strokeWidth={1.75} className={dragging ? "text-accent-ink" : "text-fg-faint"} />
        <span className="text-sm text-fg-muted">{label}</span>
        <span className="text-xs text-fg-faint">
          {accept}
          {maxSizeMB ? ` · até ${maxSizeMB} MB` : ""}
        </span>
      </button>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-negative">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) accept_(f)
        }}
        className="sr-only"
      />
    </div>
  )
}
