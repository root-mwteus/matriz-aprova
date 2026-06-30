"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AdminTable } from "@/components/admin/AdminTable"
import { createClient } from "@/lib/supabase/client"

const PAGE_SIZE = 10

interface Aluno {
  id: string
  nome: string | null
  email: string
  area_concurso: string | null
  created_at: string
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
  const colors = ["#CBFF4D", "#F0F0A8", "#FF8C42", "#4DCBFF", "#A84DFF", "#FF4D8C"]
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: `${colors[idx % colors.length]}22`, color: colors[idx % colors.length] }}
    >
      {initials}
    </div>
  )
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function AdminUsuariosPage() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [area, setArea] = useState("todas")
  const [sort, setSort] = useState<"recentes" | "antigos">("recentes")
  const [page, setPage] = useState(1)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // debounce da busca
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  // volta para a página 1 sempre que um filtro muda
  useEffect(() => {
    setPage(1)
  }, [search, area, sort])

  useEffect(() => {
    const supabase = createClient()
    let active = true
    setLoading(true)

    async function load() {
      let query = supabase
        .from("profiles")
        .select("id, nome, email, area_concurso, created_at", { count: "exact" })
        .eq("role", "user")

      if (search) {
        const safe = search.replace(/[%_,()]/g, "")
        if (safe) query = query.or(`nome.ilike.%${safe}%,email.ilike.%${safe}%`)
      }
      if (area !== "todas") {
        query = query.eq("area_concurso", area)
      }
      query = query.order("created_at", { ascending: sort === "antigos" })

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, count, error } = await query
      if (!active) return

      if (error) {
        console.error("Erro ao carregar usuários:", error)
        setAlunos([])
        setTotal(0)
      } else {
        setAlunos(data ?? [])
        setTotal(count ?? 0)
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [search, area, sort, page])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Usuários</h1>
          <span className="text-xs text-muted font-mono">{total}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[200px] bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Buscar por nome ou email..."
        />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
        >
          <option value="todas">Todas as áreas</option>
          <option value="Concursos">Concursos</option>
          <option value="OAB">OAB</option>
          <option value="Militar">Militar</option>
          <option value="ENEM">ENEM</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recentes" | "antigos")}
          className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
        >
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
        </select>
      </div>

      <div className="bg-CARD] border border-[#2A2A2A] rounded-card overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            {
              key: "aluno",
              header: "ALUNO",
              render: (row) => (
                <Link href={`/admin/usuarios/${row.id}`} className="flex items-center gap-3 group">
                  <AvatarInitials name={row.nome || row.email} />
                  <div>
                    <div className="text-sm text-foreground group-hover:text-accent transition-colors">{row.nome || "—"}</div>
                    <div className="text-[11px] text-muted">{row.email}</div>
                  </div>
                </Link>
              ),
            },
            {
              key: "area_concurso",
              header: "ÁREA",
              render: (row) => (
                <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  {row.area_concurso || "Não informado"}
                </span>
              ),
            },
            {
              key: "created_at",
              header: "CADASTRO",
              render: (row) => <span className="text-xs text-muted font-mono">{formatarData(row.created_at)}</span>,
            },
            {
              key: "acoes",
              header: "AÇÕES",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <Link href={`/admin/usuarios/${row.id}`} className="text-[11px] text-accent hover:underline">VER</Link>
                  <span className="text-muted text-[11px]">|</span>
                  <a href={`mailto:${row.email}`} className="text-[11px] text-muted hover:text-foreground">EMAIL</a>
                </div>
              ),
            },
          ]}
          data={alunos}
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </motion.div>
  )
}
