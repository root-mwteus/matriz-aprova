"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  LayoutGrid,
  Users,
  FileQuestion,
  BookOpen,
  PlayCircle,
  ClipboardList,
  Target,
  Wallet,
  Menu as MenuIcon,
  X,
  Lock,
  LogOut,
  ChevronsUpDown,
  ExternalLink,
  type LucideIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  Tooltip,
} from "@/components/ui"

/**
 * Painel administrativo.
 *
 * Mesma estrutura e mesmos componentes da aplicação — o que muda é só a
 * marcação "Admin" na barra. Manter dois shells diferentes significava
 * corrigir cada ajuste duas vezes, e os dois iam divergindo.
 *
 * Os ícones de texto (⬡ ◎ ≡ ▷ ◈ $) foram trocados por ícones de verdade:
 * glifos tipográficos renderizam com peso e tamanho imprevisíveis entre
 * sistemas, e não havia relação entre o símbolo e a seção.
 */

interface AdminNav {
  href: string
  label: string
  icon: LucideIcon
  soon?: boolean
}

const navGroups: { label: string; items: AdminNav[] }[] = [
  {
    label: "Operação",
    items: [
      { href: "/admin/dashboard", label: "Visão geral", icon: LayoutGrid },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/admin/bloqueios", label: "Bloqueios", icon: Lock },
    ],
  },
  {
    label: "Acervo",
    items: [
      { href: "/admin/questoes", label: "Questões", icon: FileQuestion },
      { href: "/admin/materiais", label: "Materiais", icon: BookOpen },
      { href: "/admin/cursos", label: "Cursos", icon: PlayCircle },
      { href: "/admin/editais", label: "Editais", icon: ClipboardList },
      { href: "/admin/simulados", label: "Simulados", icon: Target },
    ],
  },
]

const labels: Record<string, string> = {
  dashboard: "Visão geral",
  usuarios: "Usuários",
  questoes: "Questões",
  materiais: "Materiais",
  cursos: "Cursos",
  editais: "Editais",
  simulados: "Simulados",
  financeiro: "Financeiro",
  bloqueios: "Bloqueios",
  novo: "Novo",
  nova: "Nova",
  editar: "Editar",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [admin, setAdmin] = useState<{ nome: string; email?: string } | null>(null)

  useEffect(() => setDrawerOpen(false), [pathname])

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (active) setAdmin({ nome: data?.nome ?? "Admin", email: user.email })
        })
    })
    return () => {
      active = false
    }
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const current = pathname.split("/").filter(Boolean).slice(1)

  const sidebar = (
    <nav className="flex h-full flex-col bg-surface" aria-label="Navegação do painel">
      <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-line px-3">
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-[7px] bg-accent text-[11px] font-bold text-fg-on-accent"
        >
          M
        </span>
        <span className="text-sm font-semibold text-fg">Matriz</span>
        <Badge size="sm" className="ml-0.5">
          Admin
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-5")}>
            <p className="px-2 pb-1.5 text-2xs font-medium uppercase tracking-wide text-fg-faint">
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const Icon = item.icon

                if (item.soon) {
                  return (
                    <li key={item.href}>
                      <Tooltip content="Em breve" side="right" wrapperClassName="w-full">
                        <span
                          aria-disabled="true"
                          className="flex w-full cursor-not-allowed select-none items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-faint"
                        >
                          <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          <Lock size={11} strokeWidth={2} />
                        </span>
                      </Tooltip>
                    </li>
                  )
                }

                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-fast",
                        active
                          ? "bg-surface-active font-medium text-fg"
                          : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                      )}
                    >
                      <Icon
                        size={15}
                        strokeWidth={1.75}
                        className={cn("shrink-0", active ? "text-accent-ink" : "text-fg-faint")}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-line p-2">
        <Menu
          align="start"
          className="w-[204px]"
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-fast hover:bg-surface-hover"
            >
              <Avatar name={admin?.nome} size={24} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {admin?.nome ?? "Admin"}
                </span>
                <span className="block truncate text-2xs text-fg-subtle">{admin?.email ?? "—"}</span>
              </span>
              <ChevronsUpDown size={13} strokeWidth={2} className="shrink-0 text-fg-faint" />
            </button>
          }
        >
          <MenuItem icon={<ExternalLink />} onClick={() => router.push("/dashboard")}>
            Ver como aluno
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<LogOut />} destructive onClick={signOut}>
            Sair da conta
          </MenuItem>
        </Menu>
      </div>
    </nav>
  )

  return (
    <div className="dark min-h-screen bg-canvas text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar border-r border-line lg:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-[color:var(--overlay)] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-sidebar border-r border-line lg:hidden"
            >
              {sidebar}
              <IconButton
                label="Fechar menu"
                variant="ghost"
                size="sm"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-2 top-2.5"
              >
                <X size={15} strokeWidth={2} />
              </IconButton>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-sidebar">
        <header className="sticky top-0 z-20 flex h-topbar items-center gap-3 border-b border-line bg-[color:var(--surface)]/80 px-4 backdrop-blur-md lg:px-6">
          <IconButton
            label="Abrir menu"
            variant="ghost"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden"
          >
            <MenuIcon size={16} strokeWidth={2} />
          </IconButton>

          <nav aria-label="Trilha de navegação" className="min-w-0">
            <ol className="flex items-center gap-1.5 text-sm">
              <li className="hidden text-fg-subtle sm:block">Admin</li>
              {current.map((segment, i) => (
                <li key={segment + i} className="flex items-center gap-1.5">
                  <span aria-hidden className="hidden text-fg-faint sm:inline">
                    /
                  </span>
                  <span
                    className={cn(
                      "truncate",
                      i === current.length - 1 ? "font-medium text-fg" : "text-fg-subtle"
                    )}
                  >
                    {labels[segment] ?? "Detalhe"}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-content px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
