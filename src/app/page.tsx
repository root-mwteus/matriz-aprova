"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { SITE_NAME } from "@/lib/constants"

const navLinks = ["Concursos", "OAB", "Militar", "ENEM", "Preço", "FAQ"]

const benefits = [
  {
    num: "01",
    text: "Acesso às 4 áreas (Concursos, OAB, Militar, ENEM)",
  },
  {
    num: "02",
    text: "Banco com +850.000 questões",
  },
  {
    num: "03",
    text: "+2.300 materiais em PDF cirúrgicos",
  },
  {
    num: "04",
    text: "IA Preditiva da sua banca",
  },
  {
    num: "05",
    text: "Simulados com ranking nacional",
  },
  {
    num: "06",
    text: "Plano de estudos personalizado",
  },
  {
    num: "07",
    text: "Mobile + desktop · estuda em qualquer lugar",
  },
  {
    num: "08",
    text: "Garantia incondicional de 7 dias",
  },
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 80], [0, 1])

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => setScrolled(v > 40))
    return () => unsubscribe()
  }, [scrollY])

  return (
    <div className="min-h-screen bg-background bg-grid-dots bg-[length:20px_20px]">
      <Navbar scrolled={scrolled} />
      <Hero />
      <StatsSection />
      <PricingSection />
      <FeaturesSection />
      <HowItWorks />
      <Footer />
    </div>
  )
}

// ── NAVBAR ──────────────────────────────────────────────────
function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-card-border shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-accent-foreground font-bold text-sm">M</span>
            </div>
            <div className="text-xs leading-tight">
              <span className="text-muted font-medium">plataforma.</span>
              <br />
              <span className="text-foreground font-bold tracking-wider">APROVAÇÃO</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="text-muted hover:text-foreground transition-colors" title="Alternar tema">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </button>
            <Link
              href="/login"
              className="bg-transparent border border-foreground text-foreground font-semibold px-5 py-2 rounded-card text-sm hover:bg-white/5 transition-all"
            >
              ACESSAR APP
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ── HERO ────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-16 px-4">
      <motion.div
        className="max-w-4xl mx-auto text-center space-y-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="flex justify-center gap-3 flex-wrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="px-4 py-1.5 rounded-full bg-badge-bg text-accent border border-badge-border text-xs font-semibold tracking-wider">
            CONCURSOS PÚBLICOS
          </span>
          <span className="px-4 py-1.5 rounded-full bg-badge-bg text-accent border border-badge-border text-xs font-semibold tracking-wider">
            VESTIBULARES
          </span>
          <span className="px-4 py-1.5 rounded-full bg-badge-bg text-accent border border-badge-border text-xs font-semibold tracking-wider">
            MILITARES
          </span>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-title uppercase leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          SUA{" "}
          <span className="text-accent">APROVAÇÃO</span>
          <br />
          COMEÇA AQUI
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-muted max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          Milhares de questões comentadas, simulados inteligentes e um plano de estudo
          personalizado para você passar no concurso dos seus sonhos.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Link
            href="/cadastro"
            className="bg-accent text-accent-foreground font-bold px-8 py-4 rounded-card text-lg hover:bg-accent/90 transition-all w-full sm:w-auto text-center"
          >
            COMECE GRÁTIS
          </Link>
          <Link
            href="#preco"
            className="bg-transparent border border-foreground text-foreground font-bold px-8 py-4 rounded-card text-lg hover:bg-white/5 transition-all w-full sm:w-auto text-center"
          >
            VER PLANOS
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

// ── STATS ───────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: "850K+", label: "QUESTÕES" },
    { value: "2.3K+", label: "MATERIAIS" },
    { value: "5.000+", label: "ALUNOS" },
    { value: "92%", label: "APROVAÇÕES" },
  ]

  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-card-border rounded-card p-6 text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-muted tracking-widest mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PRICING (SEÇÃO PRINCIPAL) ───────────────────────────────
function PricingSection() {
  return (
    <section id="preco" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="bg-card border border-card-border rounded-card overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          {/* TOP TAG */}
          <div className="px-6 sm:px-10 pt-8 pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted font-mono"># 01 / ÚNICO · PLANO ANUAL</span>
              <span className="px-3 py-1 rounded-full bg-badge-bg text-accent border border-badge-border text-xs font-bold flex items-center gap-1">
                ⚡ ECONOMIA 70%
              </span>
              <span className="text-xs text-muted font-mono">12 MESES</span>
            </div>
          </div>

          {/* GRID CONTEÚDO */}
          <div className="grid lg:grid-cols-2 gap-0">
            {/* LADO ESQUERDO — PREÇO */}
            <div className="px-6 sm:px-10 pb-8 lg:pb-10 pt-4">
              <div className="space-y-4">
                <div className="flex items-baseline gap-4 flex-wrap">
                  <span className="text-2xl text-muted line-through font-medium">R$ 297</span>
                  <span className="text-7xl sm:text-8xl lg:text-[120px] font-bold text-foreground leading-none tracking-tight">
                    R$ 89,99
                  </span>
                </div>

                <p className="text-sm text-muted">
                  à vista · pix ou cartão / ou 12x de R$ 8,99 no cartão
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-badge-bg text-accent border border-badge-border text-sm font-bold">
                  <span>⚡ SÓ R$ 7,49 POR MÊS</span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO — BENEFÍCIOS */}
            <div className="px-6 sm:px-10 pb-8 lg:pb-10 pt-4 lg:pt-6 border-t lg:border-t-0 lg:border-l border-card-border">
              <ul className="space-y-4">
                {benefits.map((b, i) => (
                  <motion.li
                    key={b.num}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-xs text-muted font-mono w-6 flex-shrink-0 pt-0.5">
                      {b.num}
                    </span>
                    <span className="flex-1 text-sm text-foreground">{b.text}</span>
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* BOTÕES DO CARD */}
          <div className="px-6 sm:px-10 pb-6 pt-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/cadastro"
                className="flex-1 bg-accent text-accent-foreground font-bold py-4 px-8 rounded-card text-center hover:bg-accent/90 transition-all text-sm tracking-wider"
              >
                QUERO GARANTIR MEU ACESSO →
              </Link>
              <Link
                href="/cadastro"
                className="flex-1 sm:flex-none bg-transparent border border-white/20 text-foreground font-semibold py-4 px-8 rounded-card text-center hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
              >
                <span>⊙</span> TESTAR GRÁTIS
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
              <span>🔒 PAGAMENTO SEGURO · PIX · CARTÃO · BOLETO · SEM RENOVAÇÃO AUTOMÁTICA</span>
              <span className="font-mono">V2026</span>
            </div>
          </div>
        </motion.div>

        {/* BANNER INFERIOR */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-6 py-2.5 bg-card border border-card-border rounded-card text-xs text-muted font-medium">
            ⚠️ OFERTA POR TEMPO LIMITADO · VALOR CHEIO VOLTA A R$ 297
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ── FEATURES ────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: "📝",
      title: "QUESTÕES COMENTADAS",
      desc: "Banco com milhares de questões de concursos reais, todas com resolução detalhada.",
    },
    {
      icon: "🎯",
      title: "SIMULADOS INTELIGENTES",
      desc: "Simulados com timer real, correção instantânea e análise detalhada por matéria.",
    },
    {
      icon: "📊",
      title: "ESTATÍSTICAS AVANÇADAS",
      desc: "Dashboard completo com gráficos de evolução, taxa de acertos e pontos fracos.",
    },
    {
      icon: "📚",
      title: "MATERIAIS DE ESTUDO",
      desc: "PDFs, videoaulas e resumos organizados por disciplina para complementar seus estudos.",
    },
    {
      icon: "📋",
      title: "PLANO DE ESTUDO",
      desc: "Cronograma personalizado baseado no edital do seu concurso com metas diárias.",
    },
    {
      icon: "🤖",
      title: "IA PREDITIVA",
      desc: "Algoritmo inteligente que identifica seus padrões de erro e sugere questões estratégicas.",
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-sm text-muted font-mono">01</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-title uppercase text-foreground">
            TUDO QUE VOCÊ PRECISA
          </h2>
          <p className="text-muted">Ferramentas completas para sua aprovação</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-card-border rounded-card p-6 hover:border-accent/30 transition-colors group"
            >
              <span className="text-2xl mb-4 block">{f.icon}</span>
              <h3 className="text-sm font-bold tracking-widest text-foreground mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── HOW IT WORKS ────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: "01", title: "CRIE SUA CONTA", desc: "Cadastre-se gratuitamente e escolha sua área de concurso." },
    { num: "02", title: "ESCOLHA SEU FOCO", desc: "Selecione o concurso, banca ou matéria que você quer estudar." },
    { num: "03", title: "ESTUDE E EVOLUA", desc: "Resolva questões, faça simulados e acompanhe sua evolução." },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-sm text-muted font-mono">02</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-title uppercase text-foreground">
            COMO FUNCIONA
          </h2>
          <p className="text-muted">Em 3 passos simples</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-muted mb-4">{s.num}</div>
              <h3 className="text-lg font-bold tracking-wider text-foreground uppercase mb-3">{s.title}</h3>
              <p className="text-sm text-muted">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FOOTER ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-card-border py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-xs">M</span>
          </div>
          <span className="text-xs font-bold tracking-wider text-foreground">{SITE_NAME}</span>
        </Link>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
