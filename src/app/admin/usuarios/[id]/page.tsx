"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ConfirmModal } from "@/components/admin/ConfirmModal"

const tabs = ["PROGRESSO", "QUESTÕES", "SIMULADOS", "FINANCEIRO"]

const userData = {
  nome: "Ana Beatriz Santos",
  email: "ana@email.com",
  area: "OAB",
  concurso: "Exame da OAB",
  cadastro: "02/01/2026",
  ultimoAcesso: "28/06/2026 14:23",
  plano: "ANUAL",
  vencimento: "02/01/2027",
}

const progressData = [
  { materia: "Direito Constitucional", aulas: "12/15", questoes: 234, acertos: 78 },
  { materia: "Direito Civil", aulas: "8/10", questoes: 156, acertos: 65 },
  { materia: "Direito Penal", aulas: "10/10", questoes: 198, acertos: 82 },
  { materia: "Direito Processual", aulas: "5/12", questoes: 89, acertos: 45 },
  { materia: "Ética", aulas: "3/4", questoes: 67, acertos: 91 },
]

const questions = [
  { materia: "Direito Constitucional", banca: "FGV", ano: "2024", resultado: "✓", tempo: "01:23", data: "28/06" },
  { materia: "Direito Civil", banca: "CESPE", ano: "2023", resultado: "✗", tempo: "02:45", data: "28/06" },
  { materia: "Direito Penal", banca: "FCC", ano: "2024", resultado: "✓", tempo: "00:58", data: "27/06" },
]

const simulados = [
  { titulo: "Simulado OAB 01", questoes: 30, acertos: 22, pct: 73, data: "25/06/2026" },
  { titulo: "Simulado OAB 02", questoes: 30, acertos: 25, pct: 83, data: "20/06/2026" },
]

const calendarDays = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    day: d.getDate(),
    active: Math.random() > 0.5,
  }
})

export default function UserDetailPage() {
  const params = useParams()
  const [tab, setTab] = useState("PROGRESSO")
  const [showSuspend, setShowSuspend] = useState(false)
  const [active, setActive] = useState(true)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Link href="/admin/usuarios" className="text-xs text-muted hover:text-foreground font-mono inline-flex items-center gap-1">
        ← VOLTAR PARA USUÁRIOS
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA — Identidade */}
        <div className="space-y-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-6 text-center">
            <div className="w-16 h-16 rounded-xl bg-accent/20 text-accent text-xl font-bold flex items-center justify-center mx-auto mb-3">
              {userData.nome.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-foreground font-bold text-lg">{userData.nome}</h2>
            <p className="text-muted text-xs mt-1">{userData.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">{userData.area}</span>
              <span className="text-[11px] text-muted">{userData.concurso}</span>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Cadastro</span>
                <span className="text-foreground font-mono">{userData.cadastro}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Último acesso</span>
                <span className="text-foreground font-mono">{userData.ultimoAcesso}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Plano</span>
                <span className="text-green-400 font-medium">{userData.plano}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Vencimento</span>
                <span className="text-foreground font-mono">{userData.vencimento}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5 space-y-3">
            <button className="w-full text-sm bg-accent/20 text-accent border border-accent/40 px-4 py-2.5 rounded-lg font-medium hover:bg-accent/30 transition-colors">
              ENVIAR EMAIL
            </button>
            <button onClick={() => setShowSuspend(true)} className="w-full text-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-lg font-medium hover:bg-red-500/20 transition-colors">
              SUSPENDER CONTA
            </button>
            <button className="w-full text-sm text-muted border border-[#2A2A2A] px-4 py-2.5 rounded-lg hover:text-foreground transition-colors">
              RESETAR SENHA
            </button>
            <label className="flex items-center justify-between text-xs text-muted pt-2 border-t border-[#2A2A2A]">
              <span>Acesso imediato</span>
              <button
                onClick={() => setActive(!active)}
                className={`w-9 h-5 rounded-full transition-colors relative ${active ? "bg-accent" : "bg-[#2A2A2A]"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${active ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>
        </div>

        {/* COLUNA DIREITA — Tabs */}
        <div className="lg:col-span-2">
          <div className="flex border-b border-[#2A2A2A] mb-5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs font-mono px-4 py-3 border-b-2 transition-colors ${
                  tab === t ? "text-accent border-accent" : "text-muted border-transparent hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "PROGRESSO" && (
            <div className="space-y-5">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5">
                <div className="text-[11px] text-muted font-mono mb-3">STREAK · ÚLTIMOS 30 DIAS</div>
                <div className="flex gap-1 flex-wrap">
                  {calendarDays.map((d, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: d.active ? "#CBFF4D" : "#2A2A2A" }}
                      title={`Dia ${d.day}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {progressData.map((p) => (
                  <div key={p.materia} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground font-medium">{p.materia}</span>
                      <span className="text-xs text-muted font-mono">{p.aulas} aulas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${p.acertos}%` }} />
                      </div>
                      <span className="text-xs text-muted font-mono">{p.questoes}Q · {p.acertos}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "QUESTÕES" && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    {["Matéria", "Banca", "Ano", "Resultado", "Tempo", "Data"].map((h) => (
                      <th key={h} className="text-left text-[11px] text-muted font-mono font-normal px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={i} className="border-b border-[#2A2A2A] hover:bg-white/[.03]">
                      <td className="px-4 py-3 text-foreground">{q.materia}</td>
                      <td className="px-4 py-3 text-muted">{q.banca}</td>
                      <td className="px-4 py-3 text-muted font-mono">{q.ano}</td>
                      <td className="px-4 py-3">
                        <span className={q.resultado === "✓" ? "text-green-400" : "text-red-400"}>{q.resultado}</span>
                      </td>
                      <td className="px-4 py-3 text-muted font-mono">{q.tempo}</td>
                      <td className="px-4 py-3 text-muted font-mono">{q.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "SIMULADOS" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {simulados.map((s, i) => (
                <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5">
                  <div className="text-sm text-foreground font-medium">{s.titulo}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-accent">{s.pct}%</span>
                    <span className="text-xs text-muted">({s.acertos}/{s.questoes})</span>
                  </div>
                  <div className="text-xs text-muted mt-2 font-mono">{s.data}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "FINANCEIRO" && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-8 text-center">
              <p className="text-muted text-sm">Nenhum registro financeiro encontrado.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showSuspend}
        title="Suspender conta"
        description={`Tem certeza que deseja suspender o acesso de ${userData.nome}?`}
        confirmLabel="SUSPENDER"
        confirmDestructive
        onConfirm={() => { setShowSuspend(false) }}
        onCancel={() => setShowSuspend(false)}
      />
    </motion.div>
  )
}
