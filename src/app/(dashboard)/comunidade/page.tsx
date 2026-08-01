"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { MATERIAS } from "@/lib/constants"
import PageHeader from "@/components/PageHeader"
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Panel,
  SearchInput,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui"

interface StudyGroup {
  id: string
  nome: string
  descricao: string
  materia: string
  membros_count: number
  criado_em: string
  criador_id: string
  criador_nome: string
  sou_membro: boolean
}

export default function ComunidadePage() {
  const [grupos, setGrupos] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [criando, setCriando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [alternando, setAlternando] = useState<string | null>(null)
  const [novoGrupo, setNovoGrupo] = useState({ nome: "", descricao: "", materia: "" })

  useEffect(() => {
    let active = true

    fetch("/api/comunidade/grupos")
      .then((res) => res.json())
      .then((data) => {
        if (!active || data.error) return
        setGrupos(data.grupos)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Erro ao carregar grupos:", err)
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function alternarParticipacao(grupo: StudyGroup) {
    setAlternando(grupo.id)
    const metodo = grupo.sou_membro ? "DELETE" : "POST"
    try {
      const res = await fetch(`/api/comunidade/grupos/${grupo.id}/membros`, { method: metodo })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar participação")

      setGrupos((atual) =>
        atual.map((g) =>
          g.id === grupo.id
            ? { ...g, sou_membro: !g.sou_membro, membros_count: g.membros_count + (g.sou_membro ? -1 : 1) }
            : g
        )
      )
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível atualizar a participação")
    }
    setAlternando(null)
  }

  async function criarGrupo() {
    if (!podeCriar) return
    setEnviando(true)
    try {
      const res = await fetch("/api/comunidade/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoGrupo),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar grupo")

      const grupo = {
        id: data.id,
        nome: novoGrupo.nome.trim(),
        descricao: novoGrupo.descricao.trim(),
        materia: novoGrupo.materia,
        membros_count: 1,
        criado_em: new Date().toISOString(),
        criador_id: "",
        criador_nome: "",
        sou_membro: true,
      }
      setGrupos((atual) => [grupo, ...atual])
      setNovoGrupo({ nome: "", descricao: "", materia: "" })
      setCriando(false)
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível criar o grupo")
    }
    setEnviando(false)
  }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    if (!q) return grupos
    return grupos.filter(
      (g) => g.nome.toLowerCase().includes(q) || g.materia.toLowerCase().includes(q)
    )
  }, [grupos, busca])

  const podeCriar = novoGrupo.nome.trim().length >= 3 && novoGrupo.materia !== ""

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Comunidade"
        subtitle="Grupos de estudo por matéria e por banca."
        actions={
          <Button variant="accent" onClick={() => setCriando(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Novo grupo
          </Button>
        }
      />

      <div className="max-w-sm">
        <SearchInput
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou matéria…"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Panel key={i} className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </Panel>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <Panel flush>
          <EmptyState
            icon={<Users size={16} strokeWidth={1.75} />}
            title={busca ? "Nenhum grupo encontrado" : "Ainda não há grupos"}
            description={
              busca
                ? `Nada corresponde a “${busca}”. Tente outro termo.`
                : "Crie o primeiro grupo e convide outros concurseiros."
            }
            action={
              !busca ? (
                <Button variant="secondary" onClick={() => setCriando(true)}>
                  Criar o primeiro grupo
                </Button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((grupo) => (
            <Panel key={grupo.id} interactive className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold leading-snug text-fg">{grupo.nome}</h3>
                <Badge size="sm" className="shrink-0 tabular-nums">
                  {grupo.membros_count}
                </Badge>
              </div>

              <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{grupo.descricao}</p>

              <div className="flex-1" />

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="truncate text-xs text-fg-subtle">{grupo.materia}</span>
                <Button
                  variant={grupo.sou_membro ? "secondary" : "accent"}
                  size="sm"
                  disabled={alternando === grupo.id}
                  onClick={() => alternarParticipacao(grupo)}
                >
                  {alternando === grupo.id ? "…" : grupo.sou_membro ? "Sair" : "Entrar"}
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={criando}
        onClose={() => setCriando(false)}
        title="Criar grupo de estudo"
        description="Grupos ficam visíveis para todos os alunos da plataforma."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCriando(false)}>
              Cancelar
            </Button>
            <Button variant="accent" disabled={!podeCriar || enviando} onClick={criarGrupo}>
              {enviando ? "Criando…" : "Criar grupo"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-1">
          <Field
            label="Nome do grupo"
            hint="Mínimo de três caracteres. Inclua a banca, se houver."
          >
            {(props) => (
              <Input
                {...props}
                autoFocus
                placeholder="Ex.: Direito Constitucional CESPE"
                value={novoGrupo.nome}
                onChange={(e) => setNovoGrupo({ ...novoGrupo, nome: e.target.value })}
              />
            )}
          </Field>

          <Field label="Matéria principal">
            {(props) => (
              <Select
                {...props}
                value={novoGrupo.materia}
                onChange={(e) => setNovoGrupo({ ...novoGrupo, materia: e.target.value })}
              >
                <option value="">Selecione uma matéria</option>
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Descrição" optional>
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                placeholder="O que o grupo estuda e com que frequência."
                value={novoGrupo.descricao}
                onChange={(e) => setNovoGrupo({ ...novoGrupo, descricao: e.target.value })}
              />
            )}
          </Field>
        </div>
      </Modal>
    </div>
  )
}
