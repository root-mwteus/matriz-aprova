"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { SITE_NAME } from "@/lib/constants"

const etapas = [
  {
    numero: "01",
    titulo: "CONFIGURE SEU PERFIL",
    descricao: "Defina suas áreas de interesse e metas de estudo.",
  },
  {
    numero: "02",
    titulo: "DEFINA SEU FOCO",
    descricao: "Escolha o concurso ou matéria que você quer priorizar.",
  },
  {
    numero: "03",
    titulo: "COMEÇAR A ESTUDAR",
    descricao: "Acesse questões, simulados e materiais personalizados.",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)

  async function handleComplete() {
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background bg-grid-dots bg-[length:20px_20px] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-bold tracking-wider text-foreground">
            {SITE_NAME}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-title uppercase text-foreground">
            Conta criada com sucesso!
          </h1>
          <p className="text-muted text-sm">
            Vamos configurar sua experiência
          </p>
        </div>

        {step === 0 ? (
          <div className="bg-card border border-card-border rounded-card p-8 space-y-8">
            <div className="space-y-6">
              {etapas.map((e, i) => (
                <motion.div
                  key={e.numero}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-4"
                >
                  <span className="text-sm text-muted font-mono w-8">{e.numero}</span>
                  <div>
                    <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">
                      {e.titulo}
                    </h3>
                    <p className="text-sm text-muted mt-1">{e.descricao}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-card hover:bg-accent/90 transition-all text-sm tracking-wider"
            >
              CONTINUAR →
            </button>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-card p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="text-5xl">🎯</div>
              <h2 className="text-lg font-bold tracking-title uppercase text-foreground">
                Prepare-se para aprovação!
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Agora é com você. Acesse milhares de questões, simulados inteligentes
                e materiais de estudo organizados para o seu concurso.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {["📝", "🎯", "📊"].map((icon, i) => (
                <motion.div
                  key={icon}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-background border border-card-border rounded-card p-4"
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs text-muted">
                    {["Questões", "Simulados", "Estatísticas"][i]}
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-card hover:bg-accent/90 transition-all text-sm tracking-wider"
            >
              COMEÇAR A ESTUDAR →
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === i ? "bg-accent" : "bg-card-border"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
