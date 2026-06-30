"use client"

interface StatusBadgeProps {
  status: "ativo" | "trial" | "inativo" | "suspenso" | "aguardando" | "cancelado" | "reembolsado"
}

const variants: Record<string, { bg: string; text: string; border: string }> = {
  ativo: { bg: "#CBFF4D22", text: "#CBFF4D", border: "#CBFF4D44" },
  trial: { bg: "#F0F0A822", text: "#F0F0A8", border: "#F0F0A844" },
  inativo: { bg: "#44444444", text: "#888888", border: "#44444488" },
  suspenso: { bg: "#FF4D4D22", text: "#FF4D4D", border: "#FF4D4D44" },
  aguardando: { bg: "#FFCC0022", text: "#FFCC00", border: "#FFCC0044" },
  cancelado: { bg: "#FF4D4D22", text: "#FF4D4D", border: "#FF4D4D44" },
  reembolsado: { bg: "#44444444", text: "#666666", border: "#44444488" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const v = variants[status] || variants.inativo
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: v.bg, color: v.text, border: `1px solid ${v.border}` }}
    >
      {status}
    </span>
  )
}
