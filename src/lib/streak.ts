export function calcularStreakSemana(respostas: { created_at: string }[], hoje: Date = new Date()): boolean[] {
  const dia = hoje.getDay()
  const offsetParaSegunda = dia === 0 ? -6 : 1 - dia

  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + offsetParaSegunda)
  segunda.setHours(0, 0, 0, 0)

  const diasDaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda)
    d.setDate(segunda.getDate() + i)
    return d
  })

  return diasDaSemana.map((d) =>
    respostas.some((r) => new Date(r.created_at).toDateString() === d.toDateString())
  )
}
