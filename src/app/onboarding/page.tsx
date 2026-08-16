"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { resolveApiUrl } from "@/lib/fetch-utils"
import { AREAS } from "@/lib/constants"
import { CONCURSOS, encontrarConcurso } from "@/lib/gerar-plano/planos-concursos"
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
 * Agora ela pede as informações que o produto de fato usa — `area_concurso`
 * filtra questões e materiais, `data_prova` alimenta o plano de estudos e
 * a contagem regressiva — e grava no perfil. Quando o aluno escolhe um
 * concurso curado com data, o plano por semanas é gerado na hora e ele já
 * chega no painel com as semanas liberadas para começar. Tudo continua
 * pulável: um cadastro não deve ser refém do preenchimento perfeito.
 */
function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = safeNext(searchParams.get("next"))
  const [area, setArea] = useState<(typeof AREAS)[number]>("Concursos Gerais")
  const [concurso, setConcurso] = useState("")
  const [modoManual, setModoManual] = useState(false)
  const [dataProva, setDataProva] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Quem se cadastrou com área já escolhida não deve reescolher.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("area_concurso, data_prova, concurso_alvo")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.area_concurso) setArea(data.area_concurso as typeof area)
          if (data?.data_prova) setDataProva(data.data_prova)
          if (data?.concurso_alvo) {
            setConcurso(data.concurso_alvo)
            setModoManual(!encontrarConcurso(data.concurso_alvo))
          }
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
          concurso_alvo: concurso.trim() || null,
        })
        .eq("id", user.id)

      if (error) {
        toast.error("Não foi possível salvar. Tente novamente.")
        setSalvando(false)
        return
      }
    }

    // Com concurso + data, o plano por semanas é gerado na hora e o
    // aluno cai direto no cronograma. Sem isso, segue o fluxo normal.
    const gerar = concurso.trim() && dataProva
    if (gerar) {
      try {
        const res = await fetch(resolveApiUrl("/api/gerar-plano"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concurso, dataProva, horasPorDia: 4 }),
        })
        if (res.ok) {
          router.push("/plano")
          router.refresh()
          return
        }
        // Falha na geração não bloqueia o cadastro: segue para o painel.
      } catch {
        // Conexão caiu — segue para o painel mesmo assim.
      }
    }

    router.push(next ?? "/dashboard")
    router.refresh()
  }

  const hoje = new Date().toISOString().split("T")[0]
  const curadosDaArea = CONCURSOS.filter((c) => c.area === area)

  return (
    <AuthShell
      title="Vamos configurar seu estudo"
      description="Três respostas e o plano por semanas é montado na hora."
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

        <Field label="Qual concurso?" optional hint="Escolha da lista ou digite o seu.">
          {(props) => (
            <Input
              {...props}
              className="h-10"
              placeholder={modoManual ? "Ex.: Polícia Federal, TRT-SP, OAB…" : "Pesquisar…"}
              value={concurso}
              readOnly={!modoManual}
              onChange={(e) => setConcurso(e.target.value)}
            />
          )}
        </Field>

        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {curadosDaArea.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setConcurso(c.nome)
                setModoManual(false)
              }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                "transition-colors duration-fast",
                concurso === c.nome && !modoManual
                  ? "border-line-accent bg-accent-soft font-medium text-fg"
                  : "border-line-strong text-fg-muted hover:bg-surface-hover hover:text-fg"
              )}
            >
              {c.nome}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setModoManual((v) => !v)
            if (!modoManual) setConcurso("")
          }}
          className="text-xs font-medium text-accent-ink underline-offset-2 hover:underline"
        >
          {modoManual ? "Voltar para a lista" : "Meu concurso não está na lista"}
        </button>

        <Field
          label="Data da prova"
          optional
          hint="Com a data, o plano é montado até o dia da prova."
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