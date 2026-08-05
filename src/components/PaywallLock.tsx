"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatarValor } from "@/lib/pagamentos-config"
import { cn } from "@/lib/utils"
import { Button, Panel } from "@/components/ui"

/**
 * Trava do plano demo.
 *
 * Envolve o conteúdo do painel: enquanto o usuário está no plano demo,
 * qualquer rota fora das liberadas (painel e assinatura) fica borrada
 * atrás de um cadeado, com o CTA de assinatura destacado no centro da
 * tela. O conteúdo real continua visível sob o blur — mostra o que o
 * plano vitalício desbloqueia em vez de esconder tudo.
 */

interface ConfigData {
  tituloPlano: string
  descricaoPlano: string
  valorCentavos: number
  avisoBloqueio: string
}

/** Rotas que o plano demo pode acessar normalmente. */
const ROTAS_LIBERADAS = ["/dashboard"]

export default function PaywallLock({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [carregando, setCarregando] = useState(true)
  const [demo, setDemo] = useState(false)
  const [config, setConfig] = useState<ConfigData | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return Promise.resolve(false)
        return supabase
          .from("profiles")
          .select("plano")
          .eq("id", user.id)
          .single()
          .then(({ data }) => data?.plano !== "vitalicio")
      }),
      fetch("/api/pagamentos/config")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]).then(([eDemo, configData]) => {
      if (!active) return
      setDemo(Boolean(eDemo))
      setConfig(configData)
      setCarregando(false)
    })

    return () => {
      active = false
    }
  }, [supabase])

  if (carregando) return <>{children}</>

  const liberado = ROTAS_LIBERADAS.some((rota) => pathname === rota || pathname.startsWith(rota + "/"))
  const bloqueado = demo && !liberado

  if (!bloqueado) return <>{children}</>

  return (
    <div className="relative animate-rise">
      {/* Conteúdo real, borrado, como amostra do que o plano desbloqueia. */}
      <div aria-hidden className="pointer-events-none select-none blur-[5px]">
        {children}
      </div>

      {/* Cadeado central com o CTA de assinatura em destaque. */}
      <div className="absolute inset-0 z-10 grid place-items-center p-4">
        <div className="absolute inset-0 bg-canvas/55" />
        <Panel className="relative z-10 w-full max-w-md space-y-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <Lock size={24} strokeWidth={2} />
          </span>

          <div>
            <h2 className="text-lg font-semibold text-fg">
              Este recurso é exclusivo do plano vitalício
            </h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              {config?.avisoBloqueio ?? "Assine o plano vitalício para desbloquear o acesso completo à plataforma."}
            </p>
          </div>

          {config && (
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-xs text-fg-subtle">por apenas</span>
              <span className="font-mono text-3xl font-bold text-fg">
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

          <Link
            href="/dashboard"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium text-fg-subtle",
              "transition-colors duration-fast hover:text-fg"
            )}
          >
            Voltar ao painel
          </Link>
        </Panel>
      </div>
    </div>
  )
}
