"use client"

import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, IconButton } from "./Button"

/**
 * Modal.
 *
 * Cuida do que quase toda implementação caseira esquece: trava o scroll
 * do fundo, fecha no Esc, devolve o foco ao elemento que abriu, e mantém
 * o foco preso dentro do diálogo enquanto ele existe.
 *
 * A entrada é curta (140ms) e mínima — um modal que "salta" faz a
 * interface parecer lenta mesmo quando não é.
 */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg"
  /** Impede fechar por clique no fundo — só para fluxos que não podem
      ser abandonados por acidente. */
  dismissable?: boolean
}

const widths = { sm: "max-w-[380px]", md: "max-w-[520px]", lg: "max-w-[720px]" }

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "sm",
  dismissable = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  const focusables = useCallback(
    () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        ) ?? []
      ),
    []
  )

  useEffect(() => {
    if (!open) return

    restoreFocus.current = document.activeElement as HTMLElement
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"

    // Foca o diálogo, não o primeiro botão: evita destacar "Cancelar"
    // antes de a pessoa ter lido o texto.
    dialogRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissable) {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== "Tab") return

      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      document.body.style.overflow = overflow
      restoreFocus.current?.focus?.()
    }
  }, [open, onClose, dismissable, focusables])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-[color:var(--overlay)] backdrop-blur-[2px]"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full animate-pop rounded-xl border border-line bg-surface shadow-pop outline-none",
          widths[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            )}
          </div>
          {dismissable && (
            <IconButton label="Fechar" variant="ghost" size="sm" onClick={onClose} className="-mr-1.5 -mt-0.5">
              <X size={15} strokeWidth={2} />
            </IconButton>
          )}
        </div>

        {children && <div className="px-5 py-2 text-sm text-fg-muted">{children}</div>}

        {footer && (
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

/**
 * Confirmação. Um só caminho de saída perigoso, sempre à direita,
 * e o rótulo descreve o ato ("Excluir") em vez de "OK".
 */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
