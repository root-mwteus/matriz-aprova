import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes"
import { isSessionRevoked } from "@/lib/supabase/session"

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3000"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function isAppDomain(request: NextRequest) {
  const host = request.headers.get("host") || ""
  return host.startsWith("app.") || host === "localhost:3000"
}

function isLandingDomain(request: NextRequest) {
  const host = request.headers.get("host") || ""
  return !host.startsWith("app.") && host !== "localhost:3000"
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isDashboardRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = pathname.startsWith("/admin")

  // ── Usuário NÃO logado em rota protegida ──────────────────────────
  if (!user && (isDashboardRoute || isAdminRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`)

    // No app.matrizaprova.com, redireciona para a landing (login fica lá)
    if (isAppDomain(request)) {
      return NextResponse.redirect(new URL(`${LANDING_URL}/login${url.search}`))
    }

    return NextResponse.redirect(url)
  }

  // ── Usuário logado em rota de auth (login, cadastro, etc.) ────────
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"

    // Na landing, redireciona para o app (dashboard fica lá)
    if (isLandingDomain(request)) {
      return NextResponse.redirect(new URL(`${APP_URL}/dashboard`))
    }

    return NextResponse.redirect(url)
  }

  // ── Verificações de perfil (só rodam no app) ──────────────────────
  if (user && (isDashboardRoute || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspenso")
      .eq("id", user.id)
      .single()

    if (profile?.suspenso) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("suspenso", "1")

      // Na landing, redireciona para a landing
      if (isAppDomain(request)) {
        return NextResponse.redirect(new URL(`${LANDING_URL}/login?suspenso=1`))
      }

      return NextResponse.redirect(url)
    }

    /**
     * Sessão única: outro dispositivo entrou na conta e registrou outra
     * sessão. Não há chamada ao GoTrue aqui — o refresh token antigo até
     * continua válido lá, mas o check de session_id o rejeita em qualquer
     * rota protegida/API; basta limpar o cookie local para o usuário cair
     * na tela de login sem risco de loop.
     */
    if (await isSessionRevoked(supabase)) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("sessao", "1")
      const redirect = NextResponse.redirect(url)
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
          redirect.cookies.set({ name: cookie.name, value: "", path: "/", maxAge: 0 })
        }
      })
      return redirect
    }

    if (isAdminRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

/**
 * O matcher só roda nas rotas que importam: as protegidas, o /admin e as
 * telas de entrada. /api autentica por conta própria em cada rota, e as
 * páginas públicas não precisam de uma chamada a getUser() a cada visita.
 */
export const config = {
  matcher: [
    "/((?!api|auth|concursos|oab|militar|enem|_next/static|_next/image|favicon.ico|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
