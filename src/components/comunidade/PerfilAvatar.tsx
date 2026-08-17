"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { publicUrl } from "@/lib/perfil"
import { Avatar } from "@/components/ui"
import type { Moldura } from "@/types"

/**
 * Avatar com a aparência do perfil: ícone (foto/GIF) + moldura.
 *
 * Usado nos rankings, ligas e duelos. As molduras são o mesmo catálogo
 * para todos os usuários (RLS de leitura para autenticados), então o
 * catálogo é buscado uma única vez por sessão e reaproveitado.
 */

let moldurasCache: Moldura[] | null = null
let moldurasPromise: Promise<Moldura[]> | null = null

function carregarMolduras(): Promise<Moldura[]> {
  if (moldurasCache) return Promise.resolve(moldurasCache)
  if (!moldurasPromise) {
    moldurasPromise = (async () => {
      const { data } = await createClient().from("molduras").select("*")
      moldurasCache = (data as Moldura[] | null) ?? []
      return moldurasCache
    })().catch(() => {
      moldurasCache = []
      return moldurasCache
    })
  }
  return moldurasPromise as Promise<Moldura[]>
}

export default function PerfilAvatar({
  nome,
  iconePath,
  molduraId,
  size = 28,
  className,
}: {
  nome?: string | null
  iconePath?: string | null
  molduraId?: string | null
  size?: number
  className?: string
}) {
  const [molduras, setMolduras] = useState<Moldura[]>(moldurasCache ?? [])

  useEffect(() => {
    let active = true
    carregarMolduras().then((m) => {
      if (active) setMolduras(m)
    })
    return () => {
      active = false
    }
  }, [])

  const moldura = molduras.find((m) => m.id === molduraId)

  return (
    <Avatar
      name={nome}
      size={size}
      src={iconePath ? publicUrl("perfis", iconePath) : undefined}
      molduraSrc={moldura ? publicUrl("molduras", moldura.arquivo) : undefined}
      className={className}
    />
  )
}