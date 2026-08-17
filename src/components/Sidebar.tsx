"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, Lock, Settings, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { navigation, isRouteActive } from "@/lib/navigation"
import { xpProximoNivel } from "@/lib/xp"
import { Logo } from "@/components/marketing/Logo"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types"
import { Avatar, Menu, MenuItem, MenuSeparator, Tooltip } from "@/components/ui"

/**
 * Navegação lateral.
 *
 * O estado ativo é indicado por fundo + peso do texto, não por barra
 * colorida na borda: a barra deslocava o rótulo em 2px a cada troca de
 * página, e o movimento aparecia em toda navegação.
 *
 * Os rótulos saíram do caixa-alta. Versalete em item de menu reduz a
 * velocidade de leitura e não sobrou nenhuma vantagem — o grupo já
 * separa as seções.
 */

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const demo = profile != null && profile.plano !== "vitalicio"

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (active) setProfile(data)
        })
    })
    return () => {
      active = false
    }
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <nav className="flex h-full flex-col bg-surface" aria-label="Navegação principal">
      {/* ── Marca ─────────────────────────────────────────────── */}
      <div className="flex h-topbar shrink-0 items-center border-b border-line px-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-md px-1 py-1 transition-opacity duration-fast hover:opacity-80"
        >
          <Logo className="h-6 w-auto" />
        </Link>
      </div>

      {/* ── Navegação ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {navigation.map((group, gi) => (
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
                          <span className="flex-1 truncate text-left">{item.label}</span>
                          <Lock size={11} strokeWidth={2} className="shrink-0" />
                        </span>
                      </Tooltip>
                    </li>
                  )
                }

                const active = isRouteActive(pathname, item.href)
                // No plano demo tudo fica travado até assinar o vitalício.
                const travado = demo
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                        "transition-colors duration-fast",
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
                      {travado && <Lock size={11} strokeWidth={2} className="shrink-0 text-fg-faint" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Conta ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-line p-2">
        <Link
          href="/assinar"
          className={cn(
            "mb-1 flex items-center justify-between rounded-md px-2 py-1.5",
            "transition-colors duration-fast hover:bg-surface-hover"
          )}
        >
          <span className="text-2xs font-medium uppercase tracking-wide text-fg-faint">
            {profile?.plano === "vitalicio" ? "Vitalício" : "Demo"}
          </span>
          {profile?.plano !== "vitalicio" && (
            <span className="text-2xs font-medium text-accent-ink">Assinar →</span>
          )}
        </Link>
        <Menu
          align="start"
          className="w-[204px]"
          trigger={
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
                "transition-colors duration-fast hover:bg-surface-hover"
              )}
            >
              <Avatar
                name={profile?.nome}
                size={24}
                src={
                  profile?.icone_path
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/perfis/${profile.icone_path}`
                    : undefined
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {profile?.nome?.split(" ")[0] ?? "Conta"}
                </span>
                <span className="block truncate text-2xs text-fg-subtle">
                  {profile?.email ?? "—"}
                </span>
                {profile && (
                  <NivelBarra xpTotal={profile.xp_total ?? 0} />
                )}
              </span>
              <ChevronsUpDown size={13} strokeWidth={2} className="shrink-0 text-fg-faint" />
            </button>
          }
        >
          {/* Rótulo fiel ao que a rota faz: /onboarding ajusta área e data
              da prova, não "preferências" em geral. */}
          <MenuItem icon={<User />} onClick={() => router.push("/perfil")}>
            Meu perfil
          </MenuItem>
          <MenuItem icon={<Settings />} onClick={() => router.push("/onboarding")}>
            Configurar estudo
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<LogOut />} destructive onClick={signOut}>
            Sair da conta
          </MenuItem>
        </Menu>
      </div>
    </nav>
  )
}

/**
 * Barrinha de nível no rodapé da sidebar — verde brilhante embaixo do
 * e-mail. O brilho vem do gradiente + sombra; a largura reflete o
 * progresso até o próximo nível.
 */
function NivelBarra({ xpTotal }: { xpTotal: number }) {
  const { nivel, xpBase, xpAlvo, progresso } = xpProximoNivel(xpTotal)
  return (
    <span className="mt-1 block">
      <span className="flex items-center justify-between text-[10px] tabular-nums text-fg-muted">
        <span>Nível {nivel}</span>
        <span>
          {xpTotal - xpBase}/{xpAlvo - xpBase} XP
        </span>
      </span>
      <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
          style={{ width: `${progresso}%` }}
        />
      </span>
    </span>
  )
}
