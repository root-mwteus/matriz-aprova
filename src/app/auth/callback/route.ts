import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { registerCurrentSession } from "@/lib/supabase/register-session"
import { sendBoasVindas } from "@/lib/email"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")

  // Só aceita caminhos relativos internos — `//host.com` ou `\host.com`
  // sairiam do nosso domínio (open redirect).
  const rawNext = searchParams.get("next") ?? "/dashboard"
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard"

  if (code) {
    const supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Sessão única: o código trocado criou uma sessão nova (Google,
      // confirmação de e-mail ou recuperação de senha) — registra ela
      // como a ativa antes de qualquer redirect, senão o middleware do
      // destino já derrubaria por não ser a mais recente.
      await registerCurrentSession(supabase)

      // Link de recuperação de senha: trocou o código, mas ainda falta o
      // usuário definir a nova senha — mandar direto pro /dashboard faria
      // o link "funcionar" sem resetar nada.
      if (type === "recovery") {
        const res = NextResponse.redirect(`${origin}/auth/redefinir-senha`)
        supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value))
        return res
      }

      const isOAuth = user.app_metadata?.provider === "google"

      if (isOAuth) {
        // Verifica se é um novo usuário Google (sem perfil ainda)
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!profile) {
          const nome = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Estudante"
          const email = user.email ?? ""

          // Cria perfil automaticamente
          await supabase.from("profiles").insert({
            id: user.id,
            email,
            nome,
            area_concurso: "Concursos Gerais",
            role: "user",
          })

          // Envia email de boas-vindas (sem bloquear o redirect)
          sendBoasVindas({ nome, email, area: "Concursos Gerais" }).catch(() => {})

          // Novo usuário Google → onboarding
          const res = NextResponse.redirect(`${origin}/onboarding`)
          supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value))
          return res
        }
      }

      const res = NextResponse.redirect(`${origin}${next}`)
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value))
      return res
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
