export function resolveApiUrl(path: string, origin = typeof window !== "undefined" ? window.location.origin : "") {
  if (!path) throw new Error("A URL da API não pode estar vazia")

  if (/^https?:\/\//i.test(path)) return path
  if (!origin) return path

  return new URL(path, origin).toString()
}
