"use client"

import { useState, useRef, DragEvent } from "react"

interface UploadZoneProps {
  onFile: (file: File) => void
  accept?: string
}

export function UploadZone({ onFile, accept = ".pdf" }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); onFile(f) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); onFile(f) }
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors ${
        dragging ? "border-accent bg-accent/5" : "border-card-border hover:border-[#444]"
      }`}
    >
      {file ? (
        <div>
          <div className="text-accent text-2xl mb-1">📄</div>
          <p className="text-foreground font-medium">{file.name}</p>
          <p className="text-muted text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      ) : (
        <div>
          <div className="text-muted text-2xl mb-1">↑</div>
          <p className="text-muted text-sm">
            Arraste o PDF aqui ou <span className="text-accent underline">clique para selecionar</span>
          </p>
          <p className="text-muted text-[11px] mt-2 font-mono">{accept}</p>
        </div>
      )}
      <input ref={ref} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  )
}
