import {
  LayoutDashboard,
  FileQuestion,
  Target,
  BookOpen,
  CalendarDays,
  FileText,
  BarChart3,
  Users,
  Timer,
  type LucideIcon,
} from "lucide-react"

/**
 * Fonte única da navegação.
 *
 * Sidebar, trilha de navegação e busca leem daqui — antes cada um tinha
 * a própria lista, e um item novo precisava ser lembrado em três lugares.
 *
 * Os itens estão agrupados por intenção, não por ordem alfabética:
 * primeiro o que se faz todo dia, depois o que se consulta, por último o
 * que se analisa. Nove itens numa lista corrida obrigam a ler todos; em
 * três grupos de três, o olho salta direto para o grupo certo.
 */

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Recurso ainda não liberado: aparece inativo, com aviso. */
  soon?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    label: "Estudar",
    items: [
      { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
      { href: "/questoes", label: "Questões", icon: FileQuestion },
      { href: "/simulados", label: "Simulados", icon: Target },
      { href: "/cronometro", label: "Cronômetro", icon: Timer },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/materiais", label: "Materiais", icon: BookOpen },
      { href: "/plano", label: "Plano de estudos", icon: CalendarDays },
      { href: "/editais", label: "Editais", icon: FileText },
    ],
  },
  {
    label: "Acompanhar",
    items: [
      { href: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
      { href: "/comunidade", label: "Comunidade", icon: Users },
    ],
  },
]

export const navItems: NavItem[] = navigation.flatMap((g) => g.items)

/**
 * Rótulos de segmentos que não são páginas de navegação — usados pela
 * trilha para não exibir "Historico" ou um UUID cru na barra superior.
 */
const segmentLabels: Record<string, string> = {
  questoes: "Questões",
  simulados: "Simulados",
  materiais: "Materiais",
  editais: "Editais",
  estatisticas: "Estatísticas",
  comunidade: "Comunidade",
  cronometro: "Cronômetro",
  plano: "Plano de estudos",
  dashboard: "Painel",
  historico: "Histórico",
  resolver: "Resolver",
  ranking: "Ranking",
  resultado: "Resultado",
  novo: "Novo",
  nova: "Nova",
  editar: "Editar",
  usuarios: "Usuários",
  cursos: "Cursos",
  financeiro: "Financeiro",
  admin: "Admin",
}

export interface Crumb {
  label: string
  href: string
  /** Segmento dinâmico (id): não vira link, só contexto. */
  terminal?: boolean
}

/** Um id de banco não diz nada a ninguém — vira "Detalhe". */
const isOpaqueId = (s: string) => /^[0-9a-f-]{8,}$/i.test(s) || /^\d+$/.test(s)

export function breadcrumbsFor(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean)

  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    if (isOpaqueId(segment)) return { label: "Detalhe", href, terminal: true }
    return {
      label: segmentLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
      href,
    }
  })
}

/** Marca o item ativo considerando sub-rotas (/questoes/historico → Questões). */
export function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}
