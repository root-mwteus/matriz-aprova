import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/cadastro") ||
    request.nextUrl.pathname.startsWith("/recuperar-senha")

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/questoes") ||
    request.nextUrl.pathname.startsWith("/simulados") ||
    request.nextUrl.pathname.startsWith("/materiais") ||
    request.nextUrl.pathname.startsWith("/editais") ||
    request.nextUrl.pathname.startsWith("/plano") ||
    request.nextUrl.pathname.startsWith("/estatisticas")

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")

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
