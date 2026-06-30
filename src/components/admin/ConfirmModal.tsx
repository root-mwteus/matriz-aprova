"use client"

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ open, title, description, confirmLabel = "CONFIRMAR", confirmDestructive, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000088" }}>
      <div className="bg-CARD border border-[#2A2A2A] rounded-card p-6 w-full max-w-sm">
        <h3 className="text-foreground font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted text-sm mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-[#2A2A2A] rounded-lg text-muted hover:text-foreground transition-colors"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              confirmDestructive
                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                : "bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
