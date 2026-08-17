import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assinar",
  description: "Assine o plano vitalício da Matriz Aprova e desbloqueie o acesso completo à plataforma.",
}

/**
 * Página de assinatura standalone.
 *
 * Fica fora do grupo `(dashboard)` de propósito: é uma página única de
 * vendas, sem a sidebar nem a barra superior do painel. Quem chega aqui
 * está decidindo comprar — não há onde se distrair. Mesmo assim exige
 * sessão: o checkout é por usuário.
 */
export default async function AssinarLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/assinar")
  }

  return <div className="min-h-screen bg-canvas text-fg">{children}</div>
}
