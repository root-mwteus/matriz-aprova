import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes"

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

  /**
   * Rotas protegidas.
   *
   * Estava escrito como uma cadeia de `startsWith` que precisava ser
   * lembrada a cada página nova — /comunidade, /cronometro e /onboarding
   * tinham ficado de fora e só eram barrados depois, pelo layout, já com
   * o custo de uma renderização. A lista agora é uma constante única,
   * usada também pelo robots.txt.
   */
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isDashboardRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = pathname.startsWith("/admin")

  if (!user && (isDashboardRoute || isAdminRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

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
      return NextResponse.redirect(url)
    }

    if (isAdminRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
