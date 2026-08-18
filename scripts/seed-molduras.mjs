// Seed das molduras de avatar: sobe os PNGs gerados (scripts/gerar-molduras.mjs)
// para o bucket público `molduras` e grava/atualiza a linha em `molduras`
// (upsert por slug). Requer a migration 027 aplicada.
// Uso: node scripts/seed-molduras.mjs [--dry-run]

import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const ROOT = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = join(ROOT, "..", ".env")
if (existsSync(ENV_PATH)) {
  try {
    process.loadEnvFile(ENV_PATH)
  } catch {
    // sem .env, usa apenas o ambiente já configurado
  }
}

const DRY = process.argv.includes("--dry-run")

// Mesmo catálogo do gerador: slug → (nome, desbloqueio).
const MOLDURAS = [
  { slug: "cinza", nome: "Cinza", desbloqueio: "livre" },
  { slug: "esmeralda", nome: "Esmeralda", desbloqueio: "vitalicio" },
  { slug: "ouro", nome: "Ouro", desbloqueio: "vitalicio" },
  { slug: "violeta", nome: "Violeta", desbloqueio: "livre" },
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")

  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  if (DRY) {
    for (const m of MOLDURAS) {
      const file = join(ROOT, "..", "molduras", `${m.slug}.png`)
      console.log(`[dry-run] subiria molduras/${m.slug}.png e upsert (${m.nome}, ${m.desbloqueio})`)
      if (!existsSync(file)) console.log(`  ⚠ arquivo ausente: ${file}`)
    }
    return
  }

  let ok = 0
  for (const m of MOLDURAS) {
    const file = join(ROOT, "..", "molduras", `${m.slug}.png`)
    const bytes = existsSync(file) ? readFileSync(file) : null
    if (!bytes) {
      console.log(`[ausente] ${m.slug}.png — rode scripts/gerar-molduras.mjs primeiro`)
      continue
    }

    // Upload com upsert (política de UPDATE com WITH CHECK da migration 027).
    const { error: up } = await client.storage
      .from("molduras")
      .upload(`${m.slug}.png`, bytes, { upsert: true, contentType: "image/png" })
    if (up) {
      console.log(`[erro upload] ${m.slug}.png: ${up.message}`)
      continue
    }

    const { data: existente } = await client
      .from("molduras")
      .select("id")
      .eq("slug", m.slug)
      .maybeSingle()

    const res = existente
      ? await client.from("molduras").update({ nome: m.nome, desbloqueio: m.desbloqueio, arquivo: `${m.slug}.png` }).eq("id", existente.id)
      : await client.from("molduras").insert({ slug: m.slug, nome: m.nome, arquivo: `${m.slug}.png`, desbloqueio: m.desbloqueio })

    if (res.error) {
      const semMigration = res.error.code === "23505" || /does not exist|relation/i.test(res.error.message)
      console.log(`[erro linha] ${m.slug}: ${res.error.message}`)
      if (semMigration) console.log("  → confirme que a migration 027 (molduras) está aplicada")
      continue
    }

    console.log(`[ok] ${m.slug} (${m.nome}, ${m.desbloqueio})`)
    ok++
  }

  console.log(`\ntotal: ${ok}/${MOLDURAS.length} molduras aplicadas`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})