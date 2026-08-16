export const SITE_NAME = "Matriz Aprovação"
export const SITE_DESCRIPTION = "Sua aprovação começa aqui. Plataforma completa de estudos para concursos públicos, vestibulares e militares."
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

/**
 * Listas de domínio.
 *
 * Estavam copiadas dentro de Questões e de Materiais. Duas cópias já
 * tinham divergido na ordem, e um filtro mostrava matérias que o outro
 * não tinha.
 */
export const MATERIAS = [
  "Português",
  "Matemática",
  "Direito Constitucional",
  "Direito Administrativo",
  "Informática",
  "Raciocínio Lógico",
  "História",
  "Geografia",
  "Atualidades",
  "Legislação",
  "Direito Penal",
  "Direito Civil",
] as const

export const BANCAS = [
  "CESPE/CEBRASPE",
  "FGV",
  "VUNESP",
  "FCC",
  "IBFC",
  "CONSULPLAN",
  "QUADRIX",
  "CESGRANRIO",
] as const

export const AREAS = ["Concursos Gerais", "OAB", "Militar", "ENEM"] as const

/** Últimos 11 anos, do mais recente para o mais antigo. */
export const ANOS = Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - i))
