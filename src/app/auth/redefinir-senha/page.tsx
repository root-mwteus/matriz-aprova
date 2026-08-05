import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RedefinirSenhaForm } from "./form"

/**
 * Definir nova senha (fluxo de recuperação).
 *
 * O acesso a esta página só faz sentido depois que o link do e-mail
 * passou pelo /auth/callback e trocou o código por uma sessão. Sem
 * sessão não há o que resetar — manda para o login.
 */
export default async function RedefinirSenhaPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <RedefinirSenhaForm />
}
