import { xpProximoNivel } from "@/lib/xp"
import { Panel, Progress } from "@/components/ui"

/**
 * Painel de nível e XP — mostra o nível atual, a barra até o próximo
 * e o total. Usado no dashboard e no perfil; o nível vem de
 * `profiles.xp_total` via função pura (src/lib/xp.ts).
 */
export default function NivelPanel({ xpTotal }: { xpTotal: number }) {
  const { nivel, xpTotal: total, xpAlvo, faltando, progresso } = xpProximoNivel(xpTotal)

  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">Nível</h3>
        <span className="text-xs tabular-nums text-fg-subtle">{total} XP</span>
      </div>

      <p className="mt-1 text-3xl font-semibold tabular-nums text-fg">
        {nivel}
        <span className="ml-1.5 text-sm font-normal text-fg-subtle">de XP acumulado</span>
      </p>

      <Progress value={progresso} className="mt-3" label={`${progresso}% até o próximo nível`} />

      <p className="mt-2 text-xs text-fg-muted">
        {faltando > 0
          ? `${faltando} XP para o nível ${nivel + 1} (${xpAlvo} no total)`
          : "Topo da curva — parabéns!"}
      </p>
    </Panel>
  )
}