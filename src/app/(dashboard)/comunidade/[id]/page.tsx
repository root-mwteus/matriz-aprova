"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Trophy, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import Chat from "@/components/comunidade/Chat"
import Ranking from "@/components/comunidade/Ranking"
import { Avatar, Badge, Button, EmptyState, Panel, PanelHeader, Skeleton, Tabs } from "@/components/ui"

interface GrupoDetalhe {
  id: string
  nome: string
  descricao: string
  materia: string
  criado_em: string
  criador_id: string
  criador_nome: string
  membros_count: number
}

interface Membro {
  user_id: string
  nome: string
  criador: boolean
}

type Aba = "chat" | "membros" | "ranking"

export default function GrupoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [grupo, setGrupo] = useState<GrupoDetalhe | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [souMembro, setSouMembro] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [alternando, setAlternando] = useState(false)
  const [aba, setAba] = useState<Aba>("chat")

  const carregar = useCallback(() => {
    setCarregando(true)
    fetch(`/api/comunidade/grupos/${id}`)
      .then((res) => {
        if (res.status === 404) {
          router.replace("/comunidade")
          return null
        }
        if (!res.ok) throw new Error("Erro ao carregar grupo")
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setGrupo(data.grupo)
        setMembros(data.membros)
        setSouMembro(data.sou_membro)
      })
      .catch((err) => {
        console.error(err)
        toast.error("Não foi possível carregar o grupo")
      })
      .finally(() => setCarregando(false))
  }, [id, router])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function alternarParticipacao() {
    setAlternando(true)
    try {
      const res = await fetch(`/api/comunidade/grupos/${id}/membros`, {
        method: souMembro ? "DELETE" : "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar participação")
      setSouMembro(!souMembro)
      if (!souMembro) setAba("chat")
      carregar()
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível atualizar a participação")
    }
    setAlternando(false)
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl animate-rise space-y-4">
        <Skeleton className="h-6 w-64" />
        <Panel className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </Panel>
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    )
  }

  if (!grupo) return null

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-5">
      <button
        type="button"
        onClick={() => router.push("/comunidade")}
        className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors duration-fast hover:text-fg"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Comunidade
      </button>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-fg">{grupo.nome}</h1>
            <p className="mt-1 text-sm text-fg-muted">{grupo.descricao || "Sem descrição."}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
              <Badge size="sm">{grupo.materia}</Badge>
              <span>criado por {grupo.criador_nome}</span>
            </div>
          </div>
          <Button
            variant={souMembro ? "secondary" : "accent"}
            disabled={alternando}
            onClick={alternarParticipacao}
          >
            {alternando ? "…" : souMembro ? "Sair do grupo" : "Entrar no grupo"}
          </Button>
        </div>
      </Panel>

      {!souMembro && (
        <Panel className="flex flex-col items-center gap-3 py-8 text-center">
          <Users size={18} strokeWidth={1.75} className="text-fg-faint" />
          <div>
            <p className="text-sm font-medium text-fg">Você não participa deste grupo</p>
            <p className="mt-1 max-w-sm text-sm text-fg-subtle">
              Entre no grupo para conversar no chat e disputar o ranking interno.
            </p>
          </div>
          <Button variant="accent" onClick={alternarParticipacao} disabled={alternando}>
            <UserPlus size={14} strokeWidth={2} />
            {alternando ? "Entrando…" : "Entrar no grupo"}
          </Button>
        </Panel>
      )}

      <Tabs
        items={[
          { value: "chat", label: "Chat" },
          { value: "membros", label: "Membros", count: membros.length },
          { value: "ranking", label: "Ranking" },
        ]}
        value={aba}
        onChange={setAba}
      />

      {aba === "chat" &&
        (souMembro ? (
          <Chat grupoId={grupo.id} className="h-[560px]" />
        ) : (
          <Panel flush>
            <EmptyState
              icon={<MessageCircle size={16} strokeWidth={1.75} />}
              title="Chat exclusivo para membros"
              description="Entre no grupo para acompanhar a conversa."
              action={
                <Button variant="accent" onClick={alternarParticipacao} disabled={alternando}>
                  Entrar no grupo
                </Button>
              }
            />
          </Panel>
        ))}

      {aba === "membros" && (
        <Panel flush>
          <PanelHeader
            title="Membros"
            description={`${membros.length} ${membros.length === 1 ? "participante" : "participantes"}`}
          />
          {membros.length === 0 ? (
            <EmptyState icon={<Users size={16} strokeWidth={1.75} />} title="Sem membros" className="py-8" />
          ) : (
            <ul className="divide-y divide-line">
              {membros.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={m.nome} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{m.nome}</p>
                  </div>
                  {m.criador && <Badge tone="accent" size="sm">Criador</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {aba === "ranking" &&
        (souMembro ? (
          <Ranking grupoId={grupo.id} />
        ) : (
          <Panel flush>
            <EmptyState
              icon={<Trophy size={16} strokeWidth={1.75} />}
              title="Ranking exclusivo para membros"
              description="Entre no grupo para ver quem está rendendo mais em questões."
              action={
                <Button variant="accent" onClick={alternarParticipacao} disabled={alternando}>
                  Entrar no grupo
                </Button>
              }
            />
          </Panel>
        ))}
    </div>
  )
}
