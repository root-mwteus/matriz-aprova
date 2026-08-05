"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Menu as MenuIcon, Search, X, ChevronRight } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import PaywallBanner from "@/components/PaywallBanner"
import PaywallLock from "@/components/PaywallLock"
import { CommandPalette, useCommandPalette } from "@/components/CommandPalette"
import { breadcrumbsFor } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { IconButton, Kbd } from "@/components/ui"

/**
 * Estrutura da aplicação.
 *
 * Duas colunas fixas e um único ponto de rolagem — o conteúdo. Sidebar e
 * barra superior não rolam, então nunca se perde a referência de onde se
 * está numa lista longa.
 *
 * A aplicação assume o tema escuro (`dark` na raiz): é uma ferramenta de
 * sessão longa, e o marketing continua respeitando a preferência do
 * sistema, com seu próprio escopo de cor.
 */

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette()

  // Navegar fecha o menu mobile — sem isso o painel cobre a página
  // recém-aberta e a pessoa precisa fechá-lo à mão.
  useEffect(() => setDrawerOpen(false), [pathname])

  const crumbs = breadcrumbsFor(pathname)

  // Rotas que o plano demo acessa normalmente: o banner de aviso aparece
  // só nelas; nas demais o PaywallLock assume com o cadeado em destaque.
  const rotaLiberada = pathname === "/dashboard" || pathname === "/assinar"

  return (
    <div className="dark min-h-screen bg-canvas text-fg">
      {/* ── Sidebar fixa (desktop) ─────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar border-r border-line lg:block">
        <Sidebar />
      </aside>

      {/* ── Gaveta (mobile) ────────────────────────────────────── */}
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
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
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
        {/* ── Barra superior ───────────────────────────────────── */}
        <header
          className={cn(
            "sticky top-0 z-20 flex h-topbar items-center gap-3 border-b border-line",
            "bg-[color:var(--surface)]/80 px-4 backdrop-blur-md lg:px-6"
          )}
        >
          <IconButton
            label="Abrir menu"
            variant="ghost"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden"
          >
            <MenuIcon size={16} strokeWidth={2} />
          </IconButton>

          <Breadcrumbs crumbs={crumbs} />

          <div className="flex-1" />

          {/* Busca: campo falso no desktop (abre a paleta), ícone no mobile.
              Um input real aqui seria uma segunda forma de fazer a mesma
              coisa, com atalho diferente. */}
          <button
            onClick={() => setPaletteOpen(true)}
            className={cn(
              "hidden h-8 items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5",
              "text-sm text-fg-subtle transition-colors duration-fast",
              "hover:border-line-strong hover:text-fg-muted sm:flex"
            )}
          >
            <Search size={13} strokeWidth={2} />
            <span className="pr-6">Buscar</span>
            <Kbd>⌘K</Kbd>
          </button>
          <IconButton
            label="Buscar"
            variant="ghost"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="sm:hidden"
          >
            <Search size={16} strokeWidth={2} />
          </IconButton>
        </header>

        {/* ── Aviso de plano demo ─────────────────────────────── */}
        {rotaLiberada && <PaywallBanner />}

        {/* ── Conteúdo ─────────────────────────────────────────── */}
        <main className="mx-auto w-full max-w-content px-4 py-6 lg:px-8 lg:py-8">
          <PaywallLock>{children}</PaywallLock>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}

/**
 * Trilha de navegação. Colapsa para o último nível no mobile — a trilha
 * completa consumiria a largura toda e empurraria a busca para fora.
 */
function Breadcrumbs({ crumbs }: { crumbs: { label: string; href: string; terminal?: boolean }[] }) {
  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Trilha de navegação" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={crumb.href} className={cn("flex items-center gap-1", !last && "hidden sm:flex")}>
              {i > 0 && <ChevronRight size={13} className="shrink-0 text-fg-faint" aria-hidden />}
              {last || crumb.terminal ? (
                <span aria-current={last ? "page" : undefined} className="truncate font-medium text-fg">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-fg-subtle transition-colors duration-fast hover:text-fg"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
