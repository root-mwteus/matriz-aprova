import type { Moldura, PerfilResumo } from "@/types"

/**
 * Regras de perfil público.
 *
 * O formato das molduras é fixo: PNG quadrado 512×512 com transparência,
 * no bucket público `molduras`, arquivo `<slug>.png`. O desbloqueio é
 * declarativo na tabela `molduras` — aqui só a lógica de quem pode usar.
 */

export const PERFIL_ACCEPT = "image/png,image/jpeg,image/webp,image/gif"
export const ICONE_MAX_MB = 5
export const BANNER_MAX_MB = 8
export const BIO_MAX = 160
export const PROVA_ALVO_MAX = 80

const MIMES_ACEITOS = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

/** Extensão do arquivo a partir do MIME (para nomear no storage). */
export function extensaoDeMime(mime: string): string | null {
  if (mime === "image/png") return "png"
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  if (mime === "image/gif") return "gif"
  return null
}

export function imagemValida(mime: string): boolean {
  return MIMES_ACEITOS.has(mime)
}

/**
 * Molduras que um usuário pode usar: as livres e, no plano vitalício,
 * também as exclusivas. O plano demo não desbloqueia as vitais.
 */
export function moldurasDesbloqueadas(molduras: Moldura[], plano: "demo" | "vitalicio"): Moldura[] {
  return molduras.filter((m) => m.desbloqueio === "livre" || plano === "vitalicio")
}

/** Moldura que vale a pena usar (a que o usuário tem + pode aplicar). */
export function molduraUsavel(
  molduraId: string | null | undefined,
  molduras: Moldura[],
  plano: "demo" | "vitalicio"
): Moldura | null {
  if (!molduraId) return null
  const moldura = molduras.find((m) => m.id === molduraId)
  if (!moldura) return null
  return moldurasDesbloqueadas(molduras, plano).some((m) => m.id === molduraId) ? moldura : null
}

/** Converte um resumo de perfil em algo pronto para o avatar. */
export function paraAvatar(
  p: PerfilResumo | null | undefined,
  molduras: Moldura[],
  plano: "demo" | "vitalicio",
  bucket: string
): { nome: string; src: string | null; molduraSrc: string | null } {
  const moldura = molduraUsavel(p?.moldura_id, molduras, plano)
  return {
    nome: p?.nome || "Anônimo",
    src: p?.icone_path ? publicUrl(bucket, p.icone_path) : null,
    molduraSrc: moldura ? publicUrl("molduras", moldura.arquivo) : null,
  }
}

/** URL pública de um objeto num bucket público (molduras e perfis). */
export function publicUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}