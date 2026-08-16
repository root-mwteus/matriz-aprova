"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SECOES_PAINEL, type BloqueioSecao } from "@/lib/bloqueios"
import { cn } from "@/lib/utils"
import { Badge, Button, Panel, Skeleton, Textarea } from "@/components/ui"

/**
 * Bloqueio temporário de seções do painel.
 *
 * Um interruptor por seção: ligado, a aba fica borrada com cadeado
 * para o usuário e a mensagem escrita aqui vai no cartel. Escrita
 * direta via RLS (padrão do CRUD de editais) — as policies só
 * deixam admin tocar na tabela.
 */

const MENSAGEM_PADRAO =
  "Esta seção está temporariamente indisponível. Voltamos em instantes."

interface LinhaEstado extends BloqueioSecao {
  label: string
  salvando: boolean
}

export default function AdminBloqueiosPage() {
  const supabase = createClient()
  const [linhas, setLinhas] = useState<LinhaEstado[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { data } = await supabase.from("bloqueios_secao").select("secao, bloqueado, mensagem")

    const porSecao = new Map((data ?? []).map((b: BloqueioSecao) => [b.secao, b]))

    setLinhas(
      SECOES_PAINEL.map((s) => ({
        secao: s.secao,
        label: s.label,
        bloqueado: porSecao.get(s.secao)?.bloqueado ?? false,
        mensagem: porSecao.get(s.secao)?.mensagem ?? MENSAGEM_PADRAO,
        salvando: false,
      }))
    )
  }, [supabase])

  useEffect(() => {
    carregar().finally(() => setCarregando(false))
  }, [carregar])

  function atualizar(secao: string, mudancas: Partial<LinhaEstado>) {
    setLinhas((atual) => atual.map((l) => (l.secao === secao ? { ...l, ...mudancas } : l)))
  }

  async function salvar(linha: LinhaEstado) {
    atualizar(linha.secao, { salvando: true })

    const { error } = await supabase
      .from("bloqueios_secao")
      .update({
        bloqueado: linha.bloqueado,
        mensagem: linha.mensagem.trim() || MENSAGEM_PADRAO,
        updated_at: new Date().toISOString(),
      })
      .eq("secao", linha.secao)

    atualizar(linha.secao, { salvando: false })

    if (error) {
      toast.error(`Falha ao salvar ${linha.label}`)
      return
    }
    toast.success(
      linha.bloqueado ? `${linha.label} bloqueada para os usuários` : `${linha.label} liberada`
    )
  }

  return (
    <div className="animate-rise space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Bloqueios de seção</h1>
        <p className="mt-1 text-sm text-fg-subtle">
          Tranca uma aba do painel para todos os usuários — fica com o cadeado e o blur até
          você liberar. Ideal para manutenção ou conteúdo em preparação.
        </p>
      </div>

      <Panel flush>
        {carregando ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul>
            {linhas.map((linha) => (
              <li
                key={linha.secao}
                className={cn(
                  "space-y-3 border-t border-line px-4 py-4 first:border-t-0",
                  linha.bloqueado && "bg-surface-hover/50"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-fg">{linha.label}</span>
                    {linha.bloqueado && (
                      <Badge tone="caution">
                        <Lock size={11} strokeWidth={2.5} className="mr-1" />
                        bloqueada
                      </Badge>
                    )}
                  </div>

                  {/* Interruptor: liga/desliga o bloqueio da seção. */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={linha.bloqueado}
                    aria-label={`Bloquear ${linha.label}`}
                    disabled={linha.salvando}
                    onClick={() => {
                      const proximo = !linha.bloqueado
                      const nova: LinhaEstado = { ...linha, bloqueado: proximo }
                      atualizar(linha.secao, { bloqueado: proximo })
                      salvar(nova)
                    }}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-fast",
                      linha.bloqueado
                        ? "border-caution bg-caution ring-2 ring-caution/25"
                        : "border-line-strong bg-surface-sunken hover:border-fg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-canvas shadow transition-transform duration-fast",
                        linha.bloqueado ? "translate-x-[21px]" : "translate-x-[3px]"
                      )}
                    />
                  </button>
                </div>

                <Textarea
                  value={linha.mensagem}
                  onChange={(e) => atualizar(linha.secao, { mensagem: e.target.value })}
                  placeholder={MENSAGEM_PADRAO}
                  rows={2}
                  maxLength={200}
                  className="text-sm"
                  aria-label={`Mensagem exibida em ${linha.label}`}
                />

                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={linha.salvando}
                    disabled={linha.salvando}
                    onClick={() => salvar(linha)}
                  >
                    Salvar mensagem
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
