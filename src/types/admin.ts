export interface AdminUser {
  id: string
  nome: string
  email: string
  area_concurso: string | null
  data_prova: string | null
  role: "user" | "admin"
  created_at: string
  streak?: number
  progresso?: number
  plano?: string
  status?: "ativo" | "trial" | "inativo" | "suspenso"
}

export interface AdminQuestao {
  id: string
  materia: string
  sub_materia: string | null
  banca: string | null
  ano: number | null
  nivel: string | null
  enunciado: string
  alternativas: { letter: string; text: string }[]
  resposta_correta: number
  explicacao: string | null
  incidencia_pct: number | null
  area_concurso: string | null
  created_at: string
  total_respostas?: number
  pct_acerto?: number
}

export interface AdminMaterial {
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

export interface AdminCurso {
  id: string
  titulo: string
  area: string | null
  descricao: string | null
  thumbnail_url: string | null
  publicado: boolean
  ordem: number
  created_at: string
  total_modulos: number
  total_aulas: number
  total_minutos: number
}

export interface AdminModulo {
  id: string
  course_id: string
  titulo: string
  ordem: number
  aulas: AdminAula[]
}

export interface AdminAula {
  id: string
  module_id: string
  titulo: string
  video_url: string | null
  duracao_segundos: number | null
  ordem: number
}

export interface AdminSimulado {
  id: string
  user_id: string
  aluno_nome: string
  aluno_area: string | null
  questoes: { id: string; materia: string; resposta_correta: number; resposta_dada: number | null }[]
  pontuacao: number
  tempo_total: number
  created_at: string
  pct?: number
}

export interface AdminAssinatura {
  id: string
  aluno_nome: string
  aluno_email: string
  plano: string
  valor: number
  forma_pgto: string
  data_compra: string
  vencimento: string
  status: "ativo" | "aguardando" | "cancelado" | "reembolsado"
}

export interface DashboardMetrics {
  alunos_ativos: number
  variacao_alunos: string
  receita_mensal: number
  variacao_receita: string
  questoes_hoje: number
  questoes_total: number
  variacao_questoes: string
  taxa_acerto_media: number
  variacao_acerto: string
}

export interface AtividadeSemanal {
  dia: string
  questoes: number
}

export interface DistribuicaoArea {
  area: string
  valor: number
  cor: string
}
