"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Question, UserAnswer, Material } from "@/types"
import { SITE_NAME } from "@/lib/constants"
import PageHeader from "@/components/PageHeader"

const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

type QuestaoDoDia = Question & {
  resposta?: UserAnswer
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streak, setStreak] = useState<boolean[]>([false, false, true, true, true, false, false])
  const [questoes, setQuestoes] = useState<QuestaoDoDia[]>([])
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfil } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (perfil) setProfile(perfil)

      const { data: respostas } = await supabase
        .from("user_answers")
        .select("*, question:question_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (respostas) {
        setQuestoes(
          respostas.map((r: any) => ({
            ...r.question,
            resposta: {
              id: r.id,
              user_id: r.user_id,
              question_id: r.question_id,
              resposta_dada: r.resposta_dada,
              correto: r.correto,
              tempo_segundos: r.tempo_segundos,
              created_at: r.created_at,
            },
          }))
        )
      }

      const { data: mats } = await supabase
        .from("materials")
        .select("*")
        .limit(1)
        .order("incidencia_pct", { ascending: false })
      if (mats && mats.length > 0) setMaterial(mats[0])

      setLoading(false)
    }
    load()
  }, [supabase])

  const hoje = new Date().getDay()
  const diaIdx = hoje === 0 ? 6 : hoje - 1
  const initials = profile?.nome
    ? profile.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??"
  const streakCount = streak.filter(Boolean).length
  const acertos = questoes.filter((q) => q.resposta?.correto).length
  const taxaAcerto = questoes.length > 0 ? Math.round((acertos / questoes.length) * 100) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666666] text-sm animate-pulse">Carregando...</div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          badge="INÍCIO"
          title="Seu painel de estudos"
          subtitle="Resumo do seu progresso hoje"
        />
      </motion.div>

      {/* ZONE: USER + STREAK ROW */}
      <div className="flex items-start gap-4">
        <motion.div variants={itemVariants} className="flex-1">
          <UserCard profile={profile} initials={initials} streakCount={streakCount} />
        </motion.div>
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <StreakBar dias={streak} diaIdx={diaIdx} />
        </motion.div>
      </div>

      {/* ZONE: MATERIAL */}
      {material && (
        <motion.div variants={itemVariants}>
          <MaterialCard material={material} />
        </motion.div>
      )}

      {/* ZONE: QUESTOES */}
      <motion.div variants={itemVariants}>
        <QuestoesDoDia questoes={questoes} acertos={acertos} total={questoes.length} taxa={taxaAcerto} />
      </motion.div>
    </motion.div>
  )
}

// ── ZONE: USER CARD ────────────────────────────────

function UserCard({
  profile,
  initials,
  streakCount,
}: {
  profile: Profile | null
  initials: string
  streakCount: number
}) {
  return (
    <div className="flex items-center justify-between h-[72px] px-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[14px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[8px] bg-[#CBFF4D] flex items-center justify-center font-bold text-sm text-[#000000] flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#FFFFFF]">
            Olá, {profile?.nome?.split(" ")[0] || "Aluno"}
          </h2>
          <p className="text-sm text-[#666666]">
            {profile?.area_concurso
              ? `${profile.area_concurso} · concurso`
              : "concurseira"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-bold text-[#CBFF4D]">🔥 {streakCount}</span>
        <span className="text-xs text-[#666666]">DIAS</span>
      </div>
    </div>
  )
}

// ── ZONE: STREAK ───────────────────────────────────

function StreakBar({ dias, diaIdx }: { dias: boolean[]; diaIdx: number }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[14px] p-3 h-[72px] flex items-center">
      <div className="flex items-center gap-[6px]">
        {dias.map((ativo, i) => {
          const isHoje = i === diaIdx
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-[32px] h-[32px] rounded-[6px] transition-all ${
                  isHoje
                    ? ativo
                      ? "bg-[#CBFF4D] border-2 border-[#CBFF4D]"
                      : "bg-[#1A1A1A] border-2 border-[#CBFF4D]"
                    : ativo
                    ? "bg-[#CBFF4D]"
                    : "bg-[#1A1A1A] border border-[#2A2A2A]"
                }`}
              />
              <span className={`text-[10px] font-mono ${isHoje ? "text-[#CBFF4D]" : "text-[#666666]"}`}>
                {diasSemana[i]}
              </span>
              {isHoje && (
                <span className="text-[9px] text-[#CBFF4D] uppercase tracking-wider">
                  hoje
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ZONE: MATERIAL ─────────────────────────────────

function MaterialCard({ material }: { material: Material }) {
  return (
    <div className="bg-[#CBFF4D] rounded-[14px] p-4 flex items-center relative overflow-hidden h-[110px]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-[#000000]/70 uppercase tracking-wider">
            ⚡ PRÓXIMO MATERIAL · SUGERIDO PELA IA
          </span>
          <span className="px-2 py-0.5 rounded bg-[#000000]/10 text-[10px] font-bold text-[#000000]">
            {material.incidencia_pct ?? 87}% CAI
          </span>
        </div>

        <h3 className="text-sm font-bold text-[#000000] leading-tight truncate">
          {material.titulo}
        </h3>

        <p className="text-xs text-[#000000]/70 mt-0.5">
          {material.materia}{material.banca ? ` · ${material.banca}` : ""}{material.pdf_url ? " · PDF" : ""}
        </p>

        <p className="text-[11px] text-[#000000]/60 mt-0.5">
          📄 {material.paginas ?? "--"} páginas{material.professor ? ` · Prof. ${material.professor}` : ""}
        </p>
      </div>

      <button className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0 ml-3">
        <svg className="w-5 h-5 text-[#CBFF4D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  )
}

// ── ZONE: QUESTÕES ─────────────────────────────────

function QuestoesDoDia({
  questoes,
  acertos,
  total,
  taxa,
}: {
  questoes: QuestaoDoDia[]
  acertos: number
  total: number
  taxa: number | null
}) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[14px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666]">
          QUESTÕES · HOJE
        </h3>
        {taxa !== null && (
          <span className="text-xs font-bold text-[#CBFF4D]">{taxa}% acerto</span>
        )}
      </div>

      {questoes.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-[#666666]">Nenhuma questão respondida hoje</p>
          <a
            href="/questoes"
            className="inline-block mt-3 text-xs text-[#CBFF4D] font-semibold hover:underline"
          >
            Resolver questões →
          </a>
        </div>
      ) : (
        <div className="divide-y divide-[#2A2A2A]/50">
          {questoes.map((q, i) => {
            const correto = q.resposta?.correto
            return (
              <div key={q.id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    correto
                      ? "bg-[#CBFF4D] text-[#000000]"
                      : "bg-[#FF4D4D] text-[#FFFFFF]"
                  }`}
                >
                  {correto ? "✓" : "✗"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#FFFFFF] truncate">
                    {q.enunciado}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[#666666]">
                      {q.banca || "Banca"}{q.ano ? ` · ${q.ano}` : ""}
                    </span>
                    {!correto && (
                      <span className="text-[10px] text-[#FF4D4D] font-medium">
                        revisar
                      </span>
                    )}
                  </div>
                </div>
                {q.resposta?.tempo_segundos && (
                  <span className="text-[11px] text-[#666666] font-mono flex-shrink-0">
                    {Math.floor(q.resposta.tempo_segundos / 60)}m
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="px-5 py-3 border-t border-[#2A2A2A]">
        <a
          href="/questoes"
          className="text-xs text-[#666666] hover:text-[#CBFF4D] transition-colors font-semibold"
        >
          VER TODAS →
        </a>
      </div>
    </div>
  )
}
