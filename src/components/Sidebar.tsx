"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"

import {
  LayoutDashboard,
  FileQuestion,
  Target,
  BookOpen,
  CalendarDays,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react"

const sidebarLinks = [
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/questoes", label: "QUESTÕES", icon: FileQuestion },
  { href: "/simulados", label: "SIMULADOS", icon: Target },
  { href: "/materiais", label: "MATERIAIS", icon: BookOpen },
  { href: "/plano", label: "PLANO", icon: CalendarDays },
  { href: "/editais", label: "EDITAIS", icon: FileText },
  { href: "/estatisticas", label: "ESTATÍSTICAS", icon: BarChart3 },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data))
    })
  }, [supabase])

  const initials = profile?.nome
    ? profile.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??"

  return (
    <nav className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-0">
        <Link href="/dashboard" className="text-[18px] font-[800] uppercase text-accent tracking-normal">
          MATRIZ
        </Link>
        <p className="text-[9px] text-[#444444] uppercase tracking-[0.2em] mt-0.5">
          APROVAÇÃO
        </p>
      </div>

      <div className="mx-5 mt-5 border-b border-card-border" />

      <div className="flex-1 px-3 py-3 space-y-[2px] overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold uppercase tracking-[0.06em] transition-all duration-150 ${
                isActive
                  ? "bg-[#CBFF4D15] text-accent font-bold border-l-2 border-accent ml-0 pl-[10px]"
                  : "text-muted hover:bg-[#FFFFFF08] hover:text-[#888888]"
              }`}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className={`flex-shrink-0 ${
                  isActive ? "text-accent" : "text-[#444444]"
                }`}
              />
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="mx-4 border-t border-card-border" />

      <div className="p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-[13px] text-accent-foreground flex-shrink-0">
          {initials}
        </div>
        <span className="text-[11px] text-muted truncate max-w-[120px]">
          {profile?.email || "carregando..."}
        </span>
        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = "/"
          }}
          className="ml-auto text-[11px] text-[#444444] hover:text-destructive uppercase tracking-[0.06em] transition-colors flex items-center gap-1"
        >
          <LogOut size={12} strokeWidth={1.5} />
          SAIR
        </button>
      </div>
    </nav>
  )
}
