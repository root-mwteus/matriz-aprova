"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { AREAS } from "@/lib/constants"
import { cn, safeNext } from "@/lib/utils"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button, Field, Input } from "@/components/ui"

/**
 * Configuração inicial.
 *
 * Antes esta tela era decorativa: dois passos de texto estático com
 * emoji, um botão "Continuar" e nada era gravado. Quem passava por ela
 * chegava ao painel com o perfil exatamente como estava.
 *
 * Agora ela pede as duas informações que o produto de fato usa —
 * `area_concurso` filtra questões e materiais, `data_prova` alimenta a
 * contagem regressiva — e grava no perfil. Ambas continuam puláveis: um
 * cadastro não deve ser refém do preenchimento perfeito.
 */
function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = safeNext(searchParams.get("next"))
  const [area, setArea] = useState("")
  const [dataProva, setDataProva] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Quem se cadastrou com área já escolhida não deve reescolher.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("area_concurso, data_prova")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.area_concurso) setArea(data.area_concurso)
          if (data?.data_prova) setDataProva(data.data_prova)
        })
    })
  }, [supabase])

  async function salvar() {
    setSalvando(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          area_concurso: area || null,
          data_prova: dataProva || null,
        })
        .eq("id", user.id)

      if (error) {
        toast.error("Não foi possível salvar. Tente novamente.")
        setSalvando(false)
        return
      }
    }

    router.push(next ?? "/dashboard")
    router.refresh()
  }

  const hoje = new Date().toISOString().split("T")[0]

  return (
    <AuthShell
      title="Vamos configurar seu estudo"
      description="Duas respostas rápidas para o conteúdo chegar já filtrado."
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">O que você vai prestar?</legend>
          <div className="grid grid-cols-2 gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={area === a}
                onClick={() => setArea(a)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left text-sm",
                  "transition-[background-color,border-color,color] duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                  area === a
                    ? "border-line-accent bg-accent-soft font-medium text-fg"
                    : "border-line-strong bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>

        <Field
          label="Data da prova"
          optional
          hint="Se ainda não saiu o edital, deixe em branco — dá para preencher depois."
        >
          {(props) => (
            <Input
              {...props}
              type="date"
              min={hoje}
              className="h-10"
              value={dataProva}
              onChange={(e) => setDataProva(e.target.value)}
            />
          )}
        </Field>

        <div className="space-y-2 pt-1">
          <Button variant="accent" size="lg" block loading={salvando} onClick={salvar}>
            Começar a estudar
          </Button>
          <Button
            variant="ghost"
            size="lg"
            block
            disabled={salvando}
            onClick={() => router.push(next ?? "/dashboard")}
          >
            Pular por enquanto
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}
