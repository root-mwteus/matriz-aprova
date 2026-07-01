"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/admin/usuarios", label: "Usuários", icon: "◎" },
  { href: "/admin/questoes", label: "Questões", icon: "≡" },
  { href: "/admin/materiais", label: "Materiais", icon: "↓" },
  { href: "/admin/cursos", label: "Cursos", icon: "▷" },
  { href: "/admin/editais", label: "Editais", icon: "📋" },
  { href: "/admin/simulados", label: "Simulados", icon: "◈" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "$" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState("Admin")
  const [adminInitials, setAdminInitials] = useState("A")
  const [clock, setClock] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock(now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from("profiles").select("nome").eq("id", user.id).single().then(({ data }) => {
        if (data?.nome) {
          setAdminName(data.nome)
          setAdminInitials(data.nome.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase())
        }
      })
    })
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  function isActive(href: string) {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard"
    return pathname.startsWith(href)
  }

  const sidebar = (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-card-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-sm">M</div>
          <div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-mono">Admin · Painel</div>
            <div className="text-[10px] text-muted font-mono">V2026</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "text-accent bg-[#CBFF4D15] border-l-2 border-accent"
                  : "text-muted hover:text-foreground hover:bg-white/[.03]"
              }`}
            >
              <span className="w-5 text-center font-mono">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-card-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
            {adminInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground truncate">{adminName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] text-green-400 font-mono">ONLINE</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-muted hover:text-red-400 transition-colors" title="Sair">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background bg-grid-dots bg-[length:20px_20px]">
      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[52px] bg-surface border-b border-card-border flex items-center justify-between px-4 lg:pl-[256px]">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted hover:text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-xs text-muted font-mono tracking-wider">
            ADMIN / <span className="text-foreground">{pathname.split("/").pop()?.toUpperCase() || "DASHBOARD"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-56 bg-background border border-card-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Buscar usuário, questão, material..."
            />
          </div>
          <button className="relative text-muted hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-black text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
          <span className="text-[11px] text-muted font-mono hidden sm:block">{clock}</span>
        </div>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="fixed top-0 left-0 bottom-0 z-30 w-[240px] bg-surface border-r border-card-border hidden lg:flex flex-col">
        {sidebar}
      </aside>

      {/* SIDEBAR MOBILE */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-surface border-r border-card-border flex flex-col"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <main className="pt-[52px] lg:pl-[240px]">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
