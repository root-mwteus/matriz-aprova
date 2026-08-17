export interface Profile {
  id: string
  email: string
  nome: string | null
  area_concurso: string | null
  data_prova: string | null
  role: "user" | "admin"
  plano: "demo" | "vitalicio"
  suspenso?: boolean
  bio?: string | null
  prova_alvo?: string | null
  icone_path?: string | null
  banner_path?: string | null
  moldura_id?: string | null
  xp_total?: number
  created_at: string
}

/** Catálogo de molduras de avatar (PNG 512×512 transparente). */
export interface Moldura {
  id: string
  slug: string
  nome: string
  arquivo: string
  desbloqueio: "livre" | "vitalicio"
  created_at: string
}

/** Presença mínima de um usuário nos rankings/duelos. */
export interface PerfilResumo {
  nome: string
  icone_path?: string | null
  moldura_id?: string | null
}

export interface ConfigPagamentos {
  titulo_plano: string
  descricao_plano: string
  valor_centavos: number
  beneficios: string[]
  aviso_bloqueio: string
  pagamentos_ativos: boolean
}

export interface Edital {
  id: string
  orgao: string
  cargo: string | null
  banca: string | null
  area_concurso: string
  vagas: number | null
  data_prova: string | null
  data_inscricao_fim: string | null
  link: string | null
  status: "aberto" | "encerrado" | "previsto" | "sem_edital"
  created_at: string
}

export interface Course {
  id: string
  titulo: string
  area: string | null
  descricao: string | null
  thumbnail_url: string | null
  publicado: boolean
  ordem: number
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  titulo: string
  ordem: number
  created_at: string
}

export interface Lesson {
  id: string
  module_id: string
  titulo: string
  video_url: string | null
  duracao_segundos: number | null
  ordem: number
  created_at: string
}

export interface Progress {
  id: string
  user_id: string
  lesson_id: string
  concluido: boolean
  tempo_assistido: number
  updated_at: string
}

export interface QuestaoFigura {
  id: string
  storage_path: string
  legenda?: string
}

export interface Question {
  id: string
  materia: string
  sub_materia: string | null
  banca: string | null
  ano: number | null
  nivel: "facil" | "medio" | "dificil" | null
  area_concurso: string | null
  enunciado: string
  texto_referencia: string | null
  mostrar_texto: boolean
  alternativas: Alternative[]
  resposta_correta: number
  explicacao: string | null
  referencias: string | null
  figuras: QuestaoFigura[]
  incidencia_pct: number | null
  created_at: string
}

export interface Alternative {
  letter: string
  text: string
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  resposta_dada: number
  correto: boolean
  tempo_segundos: number | null
  created_at: string
}

export interface Material {
  id: string
  titulo: string
  materia: string | null
  sub_materia: string | null
  banca: string | null
  professor: string | null
  paginas: number | null
  pdf_url: string | null
  incidencia_pct: number | null
  ia_recommend: boolean
  created_at: string
}

export interface PlanoTarefa {
  materia: string
  descricao: string
  horas: number
  concluido: boolean
  ordem: number
}

export interface PlanoDia {
  dia: string
  tarefas: PlanoTarefa[]
  totalHoras: number
}

export interface StudyPlan {
  id: string
  user_id: string
  semana_inicio: string
  tarefas: PlanoDia[]
  created_at: string
}

export interface SimulationQuestion {
  id: string
  materia: string
  resposta_correta: number
}

export interface Simulation {
  id: string
  user_id: string
  questoes: SimulationQuestion[]
  pontuacao: number
  tempo_total: number
  created_at: string
}
