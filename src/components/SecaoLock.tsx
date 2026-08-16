"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SECOES_PAINEL, secaoDaRota, type BloqueioSecao } from "@/lib/bloqueios"
import { Button, Panel } from "@/components/ui"

/**
 * Bloqueio temporário de seção (chaveado pelo admin em /admin/bloqueios).
 *
 * Mesmo visual do paywall — conteúdo borrado como amostra, cadeado ao
 * centro — mas sem CTA de assinatura: aqui é o próprio produto em
 * manutenção ou preparação, com a mensagem escrita pelo admin. Só
 * tranca VISUALMENTE: as APIs da seção seguem respondendo.
 */
export default function SecaoLock({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [carregando, setCarregando] = useState(true)
  const [bloqueios, setBloqueios] = useState<BloqueioSecao[]>([])

  useEffect(() => {
    let active = true

    supabase
      .from("bloqueios_secao")
      .select("secao, bloqueado, mensagem")
      .eq("bloqueado", true)
      .then(({ data }) => {
        if (!active) return
        setBloqueios((data ?? []) as BloqueioSecao[])
        setCarregando(false)
      })

    return () => {
      active = false
    }
  }, [supabase])

  if (carregando) return <>{children}</>

  const secao = secaoDaRota(
    pathname,
    bloqueios.map((b) => b.secao)
  )
  const bloqueio = secao ? bloqueios.find((b) => b.secao === secao) : undefined

  if (!bloqueio) return <>{children}</>

  return (
    <div className="relative animate-rise">
      {/* Conteúdo real, borrado — mostra o que volta quando a seção abrir. */}
      <div aria-hidden className="pointer-events-none select-none blur-[5px]">
        {children}
      </div>

      <div className="absolute inset-0 z-10 grid place-items-center p-4">
        <div className="absolute inset-0 bg-canvas/55" />
        <Panel className="relative z-10 w-full max-w-md space-y-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <Lock size={24} strokeWidth={2} />
          </span>

          <div>
            <h2 className="text-lg font-semibold text-fg">
              {labelDaSecao(bloqueio.secao)} está temporariamente indisponível
            </h2>
            <p className="mt-1.5 text-sm text-fg-muted">{bloqueio.mensagem}</p>
          </div>

          <Link href="/dashboard" className="block">
            <Button variant="secondary" block>
              Voltar ao painel
            </Button>
          </Link>
        </Panel>
      </div>
    </div>
  )
}

function labelDaSecao(secao: string) {
  return SECOES_PAINEL.find((s) => s.secao === secao)?.label ?? "Esta seção"
}
