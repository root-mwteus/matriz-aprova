"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, Check, ImagePlus, Lock, Save, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { CONCURSOS } from "@/lib/gerar-plano/planos-concursos"
import {
  BANNER_MAX_MB,
  BIO_MAX,
  ICONE_MAX_MB,
  PERFIL_ACCEPT,
  extensaoDeMime,
  imagemValida,
  moldurasDesbloqueadas,
  publicUrl,
} from "@/lib/perfil"
import PageHeader from "@/components/PageHeader"
import { Avatar, Badge, Button, ErrorState, Panel, Skeleton } from "@/components/ui"
import type { Moldura, Profile } from "@/types"

/**
 * Meu perfil.
 *
 * Aparência (ícone, banner, moldura) + bio + prova alvo. Ícone e banner
 * aceitam foto ou GIF e vão para o bucket público `perfis/<user_id>/` —
 * o upload é direto do navegador, sem rota de API. A moldura é escolhida
 * entre as desbloqueadas (migration 027; `desbloqueio` livre/vitalício).
 */

export default function PerfilPage() {
  const supabase = createClient()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [molduras, setMolduras] = useState<Moldura[]>([])

  const [bio, setBio] = useState("")
  const [provaAlvo, setProvaAlvo] = useState("")
  const [molduraId, setMolduraId] = useState<string | null>(null)
  const [iconeFile, setIconeFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [iconeErro, setIconeErro] = useState("")
  const [bannerErro, setBannerErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const iconeInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (active) setErro("Sessão não encontrada")
        setCarregando(false)
        return
      }
      const [{ data: perfil }, { data: moldurasData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("molduras").select("*"),
      ])
      if (!active) return
      if (perfil) {
        setProfile(perfil)
        setBio(perfil.bio ?? "")
        setProvaAlvo(perfil.prova_alvo ?? "")
        setMolduraId(perfil.moldura_id ?? null)
      }
      setMolduras((moldurasData as Moldura[] | null) ?? [])
      setCarregando(false)
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const plano = profile?.plano ?? "demo"
  const desbloqueadas = useMemo(() => moldurasDesbloqueadas(molduras, plano), [molduras, plano])
  const molduraAtual = desbloqueadas.find((m) => m.id === molduraId) ?? null

  const iconeUrl = useMemo(() => {
    if (iconeFile) return URL.createObjectURL(iconeFile)
    return profile?.icone_path ? publicUrl("perfis", profile.icone_path) : null
  }, [iconeFile, profile?.icone_path])

  const bannerUrl = useMemo(() => {
    if (bannerFile) return URL.createObjectURL(bannerFile)
    return profile?.banner_path ? publicUrl("perfis", profile.banner_path) : null
  }, [bannerFile, profile?.banner_path])

  function escolherArquivo(file: File | undefined, tipo: "icone" | "banner") {
    const max = tipo === "icone" ? ICONE_MAX_MB : BANNER_MAX_MB
    const setErroF = tipo === "icone" ? setIconeErro : setBannerErro
    const setFile = tipo === "icone" ? setIconeFile : setBannerFile
    setErroF("")
    setSalvo(false)
    if (!file) return
    if (!imagemValida(file.type)) {
      setErroF("Formato não suportado (use PNG, JPG, WebP ou GIF).")
      return
    }
    if (file.size > max * 1024 * 1024) {
      setErroF(`Arquivo acima de ${max} MB.`)
      return
    }
    setFile(file)
  }

    async function salvar() {
    if (!profile) return
    setSalvando(true)
    setSalvo(false)
    setErro("")
    try {
      // Garante token de sessão válido antes do upload — o storage exige
      // autenticação e um token expirado faz o request ir sem sessão (400).
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || user.id !== profile.id) {
        throw new Error("Sessão expirada. Saia e entre novamente.")
      }

      let iconePath = profile.icone_path
      if (iconeFile) {
        const path = `${profile.id}/icone.${extensaoDeMime(iconeFile.type) ?? "png"}`
        const { error } = await supabase.storage.from("perfis").upload(path, iconeFile, { upsert: true })
        if (error) {
          console.error("upload ícone", error)
          throw new Error(`Falha ao enviar o ícone: ${error.message}`)
        }
        iconePath = path
      } else if (profile.icone_path) {
        iconePath = null
      }

      let bannerPath = profile.banner_path
      if (bannerFile) {
        const path = `${profile.id}/banner.${extensaoDeMime(bannerFile.type) ?? "png"}`
        const { error } = await supabase.storage.from("perfis").upload(path, bannerFile, { upsert: true })
        if (error) {
          console.error("upload banner", error)
          throw new Error(`Falha ao enviar o banner: ${error.message}`)
        }
        bannerPath = path
      } else if (profile.banner_path) {
        bannerPath = null
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          bio,
          prova_alvo: provaAlvo.trim(),
          moldura_id: molduraId,
          icone_path: iconePath,
          banner_path: bannerPath,
        })
        .eq("id", profile.id)
      if (error) {
        console.error("update perfil", error)
        throw new Error(`Falha ao salvar o perfil: ${error.message}`)
      }

      setProfile({ ...profile, bio, prova_alvo: provaAlvo.trim(), moldura_id: molduraId, icone_path: iconePath, banner_path: bannerPath })
      setIconeFile(null)
      setBannerFile(null)
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="animate-rise space-y-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (erro && !profile) {
    return <ErrorState description={erro} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Meu perfil"
        subtitle="Sua aparência no painel e na comunidade — molduras, bio e prova alvo."
      />

      {erro && profile && <ErrorState description={erro} onRetry={() => setErro("")} />}

      <PreviewCard
        nome={profile?.nome ?? "Sem nome"}
        email={profile?.email ?? ""}
        bio={bio}
        provaAlvo={provaAlvo}
        iconeUrl={iconeUrl}
        bannerUrl={bannerUrl}
        molduraUrl={molduraAtual ? publicUrl("molduras", molduraAtual.arquivo) : null}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <UploadPanel
          titulo="Ícone"
          dica={`Foto ou GIF, quadrado. Até ${ICONE_MAX_MB} MB · ${PERFIL_ACCEPT}`}
          erro={iconeErro}
          temAtual={Boolean(profile?.icone_path)}
          temNovo={Boolean(iconeFile)}
          inputRef={iconeInput}
          onEscolher={(f) => escolherArquivo(f, "icone")}
          onRemover={() => {
            setIconeFile(null)
            if (profile?.icone_path) setProfile({ ...profile, icone_path: null })
          }}
          preview={
            <Avatar name={profile?.nome} size={56} src={iconeUrl} className="shrink-0" />
          }
        />
        <UploadPanel
          titulo="Banner"
          dica={`Foto ou GIF panorâmico. Até ${BANNER_MAX_MB} MB`}
          erro={bannerErro}
          temAtual={Boolean(profile?.banner_path)}
          temNovo={Boolean(bannerFile)}
          inputRef={bannerInput}
          onEscolher={(f) => escolherArquivo(f, "banner")}
          onRemover={() => {
            setBannerFile(null)
            if (profile?.banner_path) setProfile({ ...profile, banner_path: null })
          }}
          preview={
            <div className="h-12 w-24 shrink-0 overflow-hidden rounded-md border border-line bg-surface-sunken">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
          }
        />
      </div>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-fg">Moldura do avatar</h3>
          {plano !== "vitalicio" && (
            <span className="text-xs text-fg-subtle">
              <Lock size={11} strokeWidth={2} className="mr-1 inline" />
              exclusivas no plano vitalício
            </span>
          )}
        </div>
        {molduras.length === 0 ? (
          <p className="mt-2 text-sm text-fg-subtle">Ainda não há molduras disponíveis.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {molduras.map((m) => {
              const bloqueada = !desbloqueadas.some((d) => d.id === m.id)
              const selecionada = m.id === molduraId
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={bloqueada}
                    onClick={() => setMolduraId(selecionada ? null : m.id)}
                    title={bloqueada ? "Disponível no plano vitalício" : m.nome}
                    className={cn(
                      "relative grid aspect-square w-full place-items-center rounded-xl border bg-surface-sunken transition-colors duration-fast",
                      selecionada
                        ? "border-accent-ink ring-2 ring-accent"
                        : "border-line hover:border-line-strong",
                      bloqueada && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={publicUrl("molduras", m.arquivo)}
                      alt={m.nome}
                      className="h-3/4 w-3/4 object-contain"
                      loading="lazy"
                    />
                    {selecionada && (
                      <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-accent-ink text-accent">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                    {bloqueada && (
                      <span className="absolute inset-0 grid place-items-center">
                        <Lock size={16} strokeWidth={2} className="text-fg-muted" />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <h3 className="text-sm font-semibold text-fg">Bio</h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          rows={3}
          maxLength={BIO_MAX}
          placeholder="Conte um pouco sobre você e seus estudos…"
          className="mt-2 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors duration-fast focus:border-accent-ink"
        />
        <p className="mt-1 text-right text-xs tabular-nums text-fg-faint">{bio.length}/{BIO_MAX}</p>

        <h3 className="mt-5 text-sm font-semibold text-fg">Prova alvo</h3>
        <p className="mt-1 text-xs text-fg-subtle">
          O concurso que você está mirando — aparece no seu perfil e direciona o plano de estudos.
        </p>
        <input
          list="concursos-sugeridos"
          value={provaAlvo}
          onChange={(e) => setProvaAlvo(e.target.value.slice(0, 80))}
          maxLength={80}
          placeholder="Ex.: Receita Federal"
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors duration-fast focus:border-accent-ink"
        />
        <datalist id="concursos-sugeridos">
          {CONCURSOS.map((c) => (
            <option key={c.id} value={c.nome} />
          ))}
        </datalist>
      </Panel>

      <div className="flex items-center gap-3">
        <Button variant="accent" onClick={salvar} disabled={salvando || Boolean(erro)}>
          <Save size={15} strokeWidth={2} /> {salvando ? "Salvando…" : "Salvar alterações"}
        </Button>
        {salvo && <span className="text-sm font-medium text-positive">Perfil salvo</span>}
      </div>
    </div>
  )
}

function PreviewCard({
  nome,
  email,
  bio,
  provaAlvo,
  iconeUrl,
  bannerUrl,
  molduraUrl,
}: {
  nome: string
  email: string
  bio: string
  provaAlvo: string
  iconeUrl: string | null
  bannerUrl: string | null
  molduraUrl: string | null
}) {
  return (
    <Panel flush className="overflow-hidden">
      <div className="relative h-36 w-full bg-surface-sunken sm:h-44">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="Banner do perfil" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-fg-faint">
            <ImagePlus size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-8 flex items-end gap-3">
          <Avatar
            name={nome}
            size={72}
            src={iconeUrl}
            molduraSrc={molduraUrl}
            className="rounded-full border-2 border-surface bg-surface"
          />
          <div className="min-w-0 pb-1">
            <p className="truncate text-base font-semibold text-fg">{nome}</p>
            <p className="truncate text-xs text-fg-subtle">{email}</p>
          </div>
        </div>
        {provaAlvo.trim() && (
          <div className="mt-3">
            <Badge tone="accent" size="sm">
              Prova alvo: {provaAlvo.trim()}
            </Badge>
          </div>
        )}
        {bio.trim() && <p className="mt-3 whitespace-pre-line text-sm text-fg-muted">{bio}</p>}
      </div>
    </Panel>
  )
}

function UploadPanel({
  titulo,
  dica,
  erro,
  temAtual,
  temNovo,
  inputRef,
  onEscolher,
  onRemover,
  preview,
}: {
  titulo: string
  dica: string
  erro: string
  temAtual: boolean
  temNovo: boolean
  inputRef: React.RefObject<HTMLInputElement>
  onEscolher: (file: File | undefined) => void
  onRemover: () => void
  preview: React.ReactNode
}) {
  return (
    <Panel>
      <h3 className="text-sm font-semibold text-fg">{titulo}</h3>
      <p className="mt-1 text-xs text-fg-subtle">{dica}</p>
      <div className="mt-3 flex items-center gap-4">
        {preview}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <Camera size={14} strokeWidth={2} /> {temNovo ? "Trocar" : "Enviar"}
          </Button>
          {(temNovo || temAtual) && (
            <Button variant="ghost" size="sm" onClick={onRemover}>
              <Trash2 size={14} strokeWidth={2} /> Remover
            </Button>
          )}
        </div>
      </div>
      {erro && (
        <p role="alert" className="mt-2 text-xs text-negative">
          {erro}
        </p>
      )}
      <input ref={inputRef} type="file" accept={PERFIL_ACCEPT} className="sr-only" onChange={(e) => onEscolher(e.target.files?.[0])} />
    </Panel>
  )
}