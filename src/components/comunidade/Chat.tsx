"use client"

import { useEffect, useRef, useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Avatar, Button, EmptyState, Input, Panel } from "@/components/ui"

/**
 * Chat ao vivo.
 *
 * Usa o Realtime do Supabase: novas mensagens caem no banco e chegam
 * aqui por `postgres_changes` no canal da tabela `mensagens`. O mesmo
 * componente serve o chat geral (`grupoId` ausente) e o de cada grupo
 * (`grupoId` definido) — a diferença é só o filtro no payload.
 *
 * O payload do Realtime não traz o nome de quem enviou (o RLS de
 * `profiles` esconde perfis alheios). Nomes desconhecidos são resolvidos
 * em lote por /api/comunidade/nomes.
 */

export interface ChatMensagem {
  id: string
  user_id: string
  grupo_id: string | null
  conteudo: string
  created_at: string
  nome?: string
}

function formatarHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

export default function Chat({ grupoId, className }: { grupoId?: string; className?: string }) {
  const supabase = createClient()
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([])
  const [texto, setTexto] = useState("")
  const [meuId, setMeuId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [online, setOnline] = useState<Map<string, string>>(new Map())
  const [digitando, setDigitando] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const nomesCache = useRef<Map<string, string>>(new Map())
  const canalRef = useRef<RealtimeChannel | null>(null)
  const avisoDigitando = useRef<number>(0)
  const timeoutDigitando = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let active = true
    setCarregando(true)

    const q = grupoId ? `?grupo_id=${encodeURIComponent(grupoId)}` : ""
    fetch(`/api/comunidade/chat${q}`)
      .then((res) => {
        if (res.status === 403) throw new Error("Você precisa entrar no grupo para conversar")
        if (!res.ok) throw new Error("Erro ao carregar mensagens")
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setMensagens(data.mensagens ?? [])
        setMeuId(data.meu_id ?? null)
        for (const m of data.mensagens ?? []) {
          nomesCache.current.set(m.user_id, m.nome)
        }
      })
      .catch((err) => {
        if (active) toast.error(err.message || "Não foi possível carregar o chat")
      })
      .finally(() => {
        if (active) setCarregando(false)
      })

    return () => {
      active = false
    }
  }, [grupoId])

  useEffect(() => {
    const aceita = (m: ChatMensagem) =>
      grupoId ? m.grupo_id === grupoId : m.grupo_id === null

    const canal = supabase
      .channel("chat-" + (grupoId ?? "geral"), { config: { presence: { key: meuId ?? "anon" } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens" },
        async (payload) => {
          const nova = payload.new as ChatMensagem
          if (!aceita(nova)) return

          setMensagens((atual) => {
            if (atual.some((m) => m.id === nova.id)) return atual
            return [...atual, { ...nova, nome: nomesCache.current.get(nova.user_id) }]
          })

          // Mensagem chegou: quem estava "digitando" enviou.
          setDigitando((atual) => (atual === nova.user_id ? null : atual))

          // Resolve o nome de quem enviou em background, uma única vez.
          if (!nomesCache.current.has(nova.user_id)) {
            try {
              const res = await fetch(`/api/comunidade/nomes?ids=${nova.user_id}`)
              const data = await res.json()
              const nome = data.nomes?.[nova.user_id]
              if (nome) {
                nomesCache.current.set(nova.user_id, nome)
                setMensagens((atual) =>
                  atual.map((m) => (m.user_id === nova.user_id && !m.nome ? { ...m, nome } : m))
                )
              }
            } catch {}
          }
        }
      )
      // "Fulano está digitando…" — broadcast efêmero, não toca o banco.
      .on("broadcast", { event: "digitando" }, (message) => {
        const dados = message.payload as { user_id?: string; nome?: string } | undefined
        if (!dados?.user_id || dados.user_id === meuId) return
        if (dados.nome) nomesCache.current.set(dados.user_id, dados.nome)
        setDigitando(dados.user_id)
        if (timeoutDigitando.current) clearTimeout(timeoutDigitando.current)
        timeoutDigitando.current = setTimeout(() => setDigitando(null), 4000)
      })
      // Presença: quem está com o chat aberto agora.
      .on("presence", { event: "sync" }, () => {
        const estados = canal.presenceState()
        const mapa = new Map<string, string>()
        for (const lista of Object.values(estados)) {
          for (const p of lista as { user_id?: string; nome?: string }[]) {
            if (p.user_id) {
              mapa.set(p.user_id, p.nome ?? "Estudante")
              if (p.nome) nomesCache.current.set(p.user_id, p.nome)
            }
          }
        }
        setOnline(mapa)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && meuId) {
          await canal.track({
            user_id: meuId,
            nome: nomesCache.current.get(meuId) ?? undefined,
          })
        }
      })

    canalRef.current = canal

    return () => {
      canalRef.current = null
      supabase.removeChannel(canal)
    }
  }, [supabase, grupoId, meuId])

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" })
  }, [mensagens.length])

  async function enviar() {
    const conteudo = texto.trim()
    if (!conteudo) return
    setEnviando(true)
    try {
      const res = await fetch("/api/comunidade/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo, grupo_id: grupoId ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao enviar mensagem")
      setTexto("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a mensagem")
    }
    setEnviando(false)
  }

  /** Avisa que estou digitando — no máximo uma vez a cada 2s. */
  function avisarDigitando() {
    const canal = canalRef.current
    if (!canal || !meuId) return
    const agora = Date.now()
    if (agora - avisoDigitando.current < 2000) return
    avisoDigitando.current = agora
    canal.send({
      type: "broadcast",
      event: "digitando",
      payload: { user_id: meuId, nome: nomesCache.current.get(meuId) },
    })
  }

  const nomeDe = (id: string) => nomesCache.current.get(id) ?? online.get(id)
  const nomeDigitando = digitando && digitando !== meuId ? nomeDe(digitando) : null

  return (
    <Panel className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
          </span>
          {online.size > 1 ? `${online.size} online` : online.size === 1 ? "você online" : "ao vivo"}
        </span>
        {nomeDigitando && (
          <span className="text-xs italic text-fg-faint">{nomeDigitando} está digitando…</span>
        )}
      </div>
      <div
        ref={listaRef}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto px-4 py-3",
          carregando && "flex items-center justify-center"
        )}
      >
        {carregando ? (
          <p className="text-sm text-fg-subtle">Carregando mensagens…</p>
        ) : mensagens.length === 0 ? (
          <EmptyState
            icon={<Send size={16} strokeWidth={1.75} />}
            title="Ninguém por aqui ainda"
            description='Seja a primeira pessoa a dar o "oi".'
            className="py-8"
          />
        ) : (
          mensagens.map((m) => {
            const minha = m.user_id === meuId
            return (
              <div key={m.id} className={cn("flex items-end gap-2", minha && "flex-row-reverse")}>
                <Avatar name={m.nome} size={26} className="mb-5 shrink-0" />
                <div className={cn("max-w-[75%] space-y-0.5", minha && "text-right")}>
                  <p className="px-1 text-xs text-fg-subtle">
                    {minha ? "Você" : m.nome || "…"}
                    <span className="ml-1.5 tabular-nums text-fg-faint">{formatarHora(m.created_at)}</span>
                  </p>
                  <div
                    className={cn(
                      "inline-block rounded-xl px-3 py-1.5 text-left text-sm leading-relaxed",
                      minha
                        ? "rounded-br-sm bg-accent text-fg-on-accent"
                        : "rounded-bl-sm bg-surface-sunken text-fg"
                    )}
                  >
                    <span className="whitespace-pre-wrap break-words">{m.conteudo}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar()
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <Input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            avisarDigitando()
          }}
          placeholder="Escreva uma mensagem…"
          maxLength={1000}
          autoComplete="off"
          className="h-9"
        />
        <Button type="submit" variant="accent" disabled={!texto.trim() || enviando} className="h-9 shrink-0 px-3">
          <Send size={14} strokeWidth={2} />
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </Panel>
  )
}
