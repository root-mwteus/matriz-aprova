"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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

/**
 * Comunidade.
 *
 * O formulário de novo grupo agora valida antes de habilitar o envio e
 * mostra o motivo — o botão desabilitado sem explicação deixava a pessoa
 * sem saber qual campo faltava.
 *
 * A ficha do grupo perdeu o quadrado de ícone: eram três ícones idênticos
 * lado a lado, sem distinguir nada. O espaço foi para o nome e a
 * descrição, que é o que diferencia um grupo do outro.
 */

interface StudyGroup {
  id: string
  nome: string
  descricao: string
  materia: string
  membros_count: number
  criado_em: string
  criador_id: string
}

export default function ComunidadePage() {
  const supabase = createClient()
  const [grupos, setGrupos] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [criando, setCriando] = useState(false)
  const [novoGrupo, setNovoGrupo] = useState({ nome: "", descricao: "", materia: "" })

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Dados de exemplo até a tabela de grupos existir no banco.
      const hoje = new Date().toISOString()
      setGrupos([
        {
          id: "1",
          nome: "Direito Constitucional CESPE",
          descricao: "Questões de Direito Constitucional das bancas CESPE e CEBRASPE.",
          materia: "Direito Constitucional",
          membros_count: 24,
          criado_em: hoje,
          criador_id: "abc123",
        },
        {
          id: "2",
          nome: "OAB 1ª Fase FGV",
          descricao: "Preparação para a primeira fase do exame de ordem.",
          materia: "OAB",
          membros_count: 18,
          criado_em: hoje,
          criador_id: "abc123",
        },
        {
          id: "3",
          nome: "Português para Concursos",
          descricao: "Gramática e interpretação com foco em questões de prova.",
          materia: "Português",
          membros_count: 31,
          criado_em: hoje,
          criador_id: "abc123",
        },
      ])
      setLoading(false)
    }
    load()
  }, [supabase])

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
                <span className="shrink-0 text-sm font-medium text-accent-ink">Entrar</span>
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
            <Button variant="accent" disabled={!podeCriar} onClick={() => setCriando(false)}>
              Criar grupo
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
