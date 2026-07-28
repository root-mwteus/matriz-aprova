"use client"

import { ConfirmModal as BaseConfirmModal } from "@/components/ui"

/**
 * Fachada do modal de confirmação do sistema.
 *
 * A versão anterior não travava o scroll do fundo, não fechava no Esc e
 * não devolvia o foco ao fechar — problemas que o componente base já
 * resolve. Aqui só adapta o nome da prop `confirmDestructive`.
 */

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmDestructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ confirmDestructive, ...props }: ConfirmModalProps) {
  return <BaseConfirmModal destructive={confirmDestructive} {...props} />
}
