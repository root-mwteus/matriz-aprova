"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatarValor } from "@/lib/pagamentos-config"
import { Button, Panel } from "@/components/ui"

/**
 * Portão de plano premium.
 *
 * Bloqueia seções inteiras para quem está no plano demo: em vez do
 * conteúdo, mostra uma explicação de que é preciso assinar para
 * desbloquear. Usado em telas de uso intenso (ex.: ranking nacional).
 * O texto e o preço vêm da config editável no painel admin.
 */

interface ConfigData {
  tituloPlano: string
  descricaoPlano: string
  valorCentavos: number
  avisoBloqueio: string
}

export default function PaywallGate({
  title = "Recurso exclusivo do plano vitalício",
  children,
}: {
  title?: string
  children?: React.ReactNode
}) {
  const supabase = createClient()
  const [carregando, setCarregando] = useState(true)
  const [bloqueado, setBloqueado] = useState(false)
  const [config, setConfig] = useState<ConfigData | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return Promise.resolve(null)
        return supabase
          .from("profiles")
          .select("plano")
          .eq("id", user.id)
          .single()
          .then(({ data }) => data?.plano ?? "demo")
      }),
      fetch("/api/pagamentos/config")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]).then(([plano, configData]) => {
      if (!active) return
      setBloqueado(plano !== "vitalicio")
      setConfig(configData)
      setCarregando(false)
    })

    return () => {
      active = false
    }
  }, [supabase])

  if (carregando) return null
  if (!bloqueado) return <>{children}</>

  return (
    <div className="grid place-items-center py-10">
      <Panel className="w-full max-w-md space-y-4 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
          <Lock size={20} strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            {config?.avisoBloqueio ?? "Assine o plano vitalício para desbloquear este recurso."}
          </p>
        </div>
        {config && (
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-mono text-xs text-fg-subtle">por apenas</span>
            <span className="font-mono text-2xl font-bold text-fg">
              {formatarValor(config.valorCentavos)}
            </span>
            <span className="text-xs text-fg-subtle">pagamento único</span>
          </div>
        )}
        <Link href="/assinar" className="block">
          <Button variant="accent" block>
            Assinar e desbloquear agora
          </Button>
        </Link>
      </Panel>
    </div>
  )
}
