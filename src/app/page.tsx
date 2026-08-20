import Link from "next/link"
import { Logo } from "@/components/marketing/Logo"
import { ThemeToggle } from "@/components/marketing/ThemeToggle"

export default function HomePage() {
  return (
    <div className="font-sans bg-paper dark:bg-ink min-h-screen">

      {/* ── Seta "Mais!" fixa no canto ── */}
      <Link
        href="#preco"
        aria-label="Ver mais"
        className="fixed bottom-24 right-5 z-[60] flex flex-col items-center -rotate-6 select-none group"
      >
        <span className="font-display font-bold text-lg text-ink bg-lime border-2 border-ink rounded-lg px-3 py-1 shadow-lg group-hover:-translate-y-1 transition-transform">Mais!</span>
        <svg className="w-9 h-14 text-lime-dark dark:text-lime drop-shadow group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 40" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v24" />
          <path d="M5 21l7 7 7-7" />
        </svg>
      </Link>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-paper/90 dark:bg-ink/90 backdrop-blur border-b-2 border-ink dark:border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-8 w-auto" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70 dark:text-paper/70">
              <Link href="/concursos" className="hover:text-ink dark:hover:text-paper transition">Concursos</Link>
              <Link href="/oab" className="hover:text-ink dark:hover:text-paper transition">OAB</Link>
              <Link href="/militar" className="hover:text-ink dark:hover:text-paper transition">Militar</Link>
              <Link href="/enem" className="hover:text-ink dark:hover:text-paper transition">ENEM</Link>
              <span className="text-ink/20 dark:text-paper/20">|</span>
              <a href="#preco" className="hover:text-ink dark:hover:text-paper transition">Preço</a>
              <a href="#faq" className="hover:text-ink dark:hover:text-paper transition">FAQ</a>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:inline-flex font-mono text-xs font-semibold border-2 border-ink dark:border-paper/30 px-3 py-2 rounded-md cta-ghost items-center gap-1.5 text-ink dark:text-paper">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                ACESSAR APP
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-paper dark:bg-ink overflow-hidden border-b-2 border-ink dark:border-paper/10" aria-labelledby="hero-title">
        <div className="absolute inset-0 matrix-grid opacity-50"></div>
        <div className="absolute top-24 right-12 font-mono text-xs text-lime-dark/60 dark:text-lime/60 hidden lg:block animate-pulse-slow">[ 04 · 12 ]</div>
        <div className="absolute bottom-20 left-12 font-mono text-xs text-lime-dark/60 dark:text-lime/60 hidden lg:block animate-pulse-slow" style={{animationDelay: '1s'}}>[ 18 · 03 ]</div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">

            <div className="lg:col-span-7 animate-rise">
              <div className="inline-flex items-center gap-2 bg-ink dark:bg-lime text-paper dark:text-ink px-3 py-1.5 rounded-full mb-6 shadow-lg">
                <span className="w-1.5 h-1.5 bg-lime dark:bg-ink rounded-full pulse-soft"></span>
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest font-semibold">Plataforma Desenvolvida por Aprovados.</span>
              </div>

              <h1 id="hero-title" className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-ink dark:text-paper leading-[1.02] tracking-tight">
                Estude o que cai.<br />
                Passe <span className="text-lime-dark dark:text-lime">em menos tempo.</span>
              </h1>

              <p className="mt-7 text-lg text-ink/70 dark:text-paper/70 max-w-2xl leading-relaxed">
                A <strong className="text-ink dark:text-paper">Matriz</strong> usa <strong className="text-ink dark:text-paper">IA preditiva</strong> treinada em 10 anos de provas da sua banca. Entregamos <strong className="text-ink dark:text-paper">PDFs cirúrgicos</strong>, <strong className="text-ink dark:text-paper">simulados no estilo real</strong> e <strong className="text-ink dark:text-paper">questões comentadas</strong> — só o que tem chance real de cair.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
                <Link href="/assinar" className="cta-primary inline-flex items-center justify-center gap-3 bg-lime text-ink font-display font-bold text-base px-7 py-4 rounded-lg border-2 border-ink group">
                  QUERO MINHA APROVAÇÃO · R$ 49,99
                  <span className="font-mono group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link href="/cadastro" className="cta-secondary inline-flex items-center justify-center gap-2 bg-paper dark:bg-transparent text-ink dark:text-paper font-display font-bold text-base px-7 py-4 rounded-lg border-2 border-ink dark:border-paper/50 group">
                  <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  TESTAR GRÁTIS
                </Link>
              </div>

              <div className="mt-3 font-mono text-xs text-ink/50 dark:text-paper/50">
                sem cartão · acesso imediato · limitações no plano demo
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-ink/60 dark:text-paper/60">
                <span className="flex items-center gap-1.5"><span className="text-lime-dark dark:text-lime">✓</span> Plano vitalício · 1 pagamento</span>
                <span className="flex items-center gap-1.5"><span className="text-lime-dark dark:text-lime">✓</span> 7 dias garantia incondicional</span>
                <span className="flex items-center gap-1.5"><span className="text-lime-dark dark:text-lime">✓</span> Sem mensalidade · sem renovação</span>
              </div>

              {/* Trust Bar */}
              <div className="mt-10 pt-8 border-t-2 border-ink/10 dark:border-paper/10 flex flex-wrap items-center gap-6 text-sm text-ink/50 dark:text-paper/50">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <svg className="w-3.5 h-3.5 text-lime-dark dark:text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pagamento seguro</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <svg className="w-3.5 h-3.5 text-lime-dark dark:text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>PIX · Cartão · Boleto</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <svg className="w-3.5 h-3.5 text-lime-dark dark:text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Acesso imediato</span>
                </div>
              </div>
            </div>

            {/* App mockup */}
            <div className="lg:col-span-5 relative">
              <div className="bg-ink text-paper rounded-2xl border-2 border-ink relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 matrix-grid-dark"></div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-lime/10 rounded-full blur-3xl hidden lg:block"></div>

                <div className="relative flex items-center justify-between px-5 py-3 border-b border-paper/10 bg-ink-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-paper/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-paper/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-paper/20"></div>
                  </div>
                  <div className="font-mono text-[10px] text-paper/50">app.matrizaprova.com</div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative">
                      <span className="w-1.5 h-1.5 bg-lime rounded-full pulse-soft"></span>
                    </span>
                    <span className="font-mono text-[10px] text-lime">online</span>
                  </div>
                </div>

                <div className="relative p-5 space-y-3">
                  {/* Streak card - enhanced */}
                  <div className="bg-ink-2 rounded-xl p-4 border border-paper/10 hover:border-lime/30 transition-colors duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-area-concursos flex items-center justify-center text-ink font-display font-bold text-sm group-hover:scale-110 transition-transform">LM</div>
                        <div>
                          <div className="text-sm font-semibold text-paper leading-tight">Olá, Luiza!</div>
                          <div className="font-mono text-[10px] text-paper/50">concurseira · TRT-RJ</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-xl text-lime stat-num leading-none">18</div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-paper/50">dias seguidos</div>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-8 mt-2">
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '30%', animationDelay: '.05s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '55%', animationDelay: '.1s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '40%', animationDelay: '.15s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '75%', animationDelay: '.2s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '60%', animationDelay: '.25s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '85%', animationDelay: '.3s' }}></div>
                      <div className="flex-1 bg-lime rounded-sm mini-bar" style={{ height: '100%', animationDelay: '.35s' }}></div>
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-paper/40 mt-1.5 uppercase">
                      <span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span className="text-lime font-bold">D · hoje</span>
                    </div>
                  </div>

                  {/* Próximo material - AI suggested */}
                  <div className="bg-lime text-ink rounded-xl p-4 relative overflow-hidden scan-line group">
                    <div className="absolute -top-2 -right-2 w-16 h-16 bg-ink/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/70 font-bold">📄 Próximo material</span>
                        <span className="bg-ink text-lime font-mono text-[8px] px-2 py-0.5 rounded-full font-bold">sugerido pela IA</span>
                      </div>
                      <div className="bg-ink text-lime font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">87% chance</div>
                    </div>
                    <div className="font-display font-bold text-lg text-ink leading-tight mb-1 relative z-10">Atos Administrativos</div>
                    <div className="text-xs text-ink/70 mb-3 relative z-10">Direito Administrativo · CESPE · PDF</div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 font-mono text-xs text-ink/80">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold">28 páginas</span>
                        <span className="text-ink/40">·</span>
                        <span>Prof. Sandra Cunha</span>
                      </div>
                      <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center group-hover:bg-lime group-hover:text-ink transition-colors">
                        <svg className="w-3.5 h-3.5 text-lime group-hover:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Questões do dia */}
                  <div className="bg-ink-2 rounded-xl border border-paper/10 overflow-hidden hover:border-lime/30 transition-colors duration-300">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-paper/10">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-paper/60 font-semibold">/ questões · hoje</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-lime rounded-full pulse-soft"></div>
                        <span className="font-mono text-[10px] text-lime stat-num">74% acerto</span>
                      </div>
                    </div>
                    <div className="divide-y divide-paper/5">
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper/5 transition-colors group">
                        <div className="w-5 h-5 bg-lime/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <svg className="w-3 h-3 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-paper truncate">Princípios da Administração Pública</div>
                          <div className="font-mono text-[9px] text-paper/40">CESPE · 2023</div>
                        </div>
                        <div className="font-mono text-[10px] text-paper/50">00:42</div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper/5 transition-colors group">
                        <div className="w-5 h-5 bg-lime/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <svg className="w-3 h-3 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-paper truncate">Controle dos Atos Administrativos</div>
                          <div className="font-mono text-[9px] text-paper/40">FCC · 2024</div>
                        </div>
                        <div className="font-mono text-[10px] text-paper/50">01:08</div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper/5 transition-colors group">
                        <div className="w-5 h-5 bg-area-oab/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <svg className="w-3 h-3 text-area-oab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-paper/70 truncate">Revogação vs. Anulação</div>
                          <div className="font-mono text-[9px] text-paper/40">CESPE · 2024 · revisar</div>
                        </div>
                        <div className="font-mono text-[10px] text-paper/50">02:11</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between font-mono text-[10px] text-ink/40 dark:text-paper/40 px-2">
                <span>[ MATRIZ.v2026 · prévia interativa do app ]</span>
                <Link href="/cadastro" className="hover:text-ink dark:hover:text-paper underline underline-offset-2 flex items-center gap-1">testar agora →</Link>
              </div>
              
              {/* Mobile hint */}
              <div className="mt-4 lg:hidden text-center">
                <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Arraste para ver mais →</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="bg-lime border-y-2 border-ink overflow-hidden py-3">
        <div className="ticker-track whitespace-nowrap font-mono text-sm font-bold text-ink">
          <div className="inline-flex items-center gap-8 px-8">
            <span>★ BANCO DE QUESTÕES</span><span>★</span>
            <span>MATERIAIS EM PDF</span><span>★</span>
            <span>MÚLTIPLAS BANCAS</span><span>★</span>
            <span>IA PREDITIVA</span><span>★</span>
            <span>4 ÁREAS · 1 ACESSO</span><span>★</span>
            <span>R$ 49,99 · VITALÍCIO</span><span>★</span>
          </div>
          <div className="inline-flex items-center gap-8 px-8" aria-hidden="true">
            <span>★ BANCO DE QUESTÕES</span><span>★</span>
            <span>MATERIAIS EM PDF</span><span>★</span>
            <span>MÚLTIPLAS BANCAS</span><span>★</span>
            <span>IA PREDITIVA</span><span>★</span>
            <span>4 ÁREAS · 1 ACESSO</span><span>★</span>
            <span>R$ 49,99 · VITALÍCIO</span><span>★</span>
          </div>
        </div>
      </div>

      {/* ── AS 4 ÁREAS ── */}
      <section id="areas" className="py-20 lg:py-28 bg-paper dark:bg-ink border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-50"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ quatro áreas · um acesso</span>
              <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.05]">
                Para qual prova você<br />
                <span className="highlight-lime">vai gabaritar?</span>
              </h2>
            </div>
            <p className="text-ink/60 dark:text-paper/60 max-w-sm">
              Cada área tem sua própria trilha, curadoria e IA treinada na banca específica. Tudo no mesmo acesso anual.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <Link href="/concursos" className="area-card bg-area-concursos text-ink rounded-2xl p-6 border-2 border-ink flex flex-col group">
              <div className="flex items-start justify-between mb-12">
                <div className="font-mono text-xs font-bold">№ 01</div>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-area-concursos" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">Concursos Públicos</h3>
              <p className="text-sm text-ink/75 leading-relaxed mb-5 flex-1">Federais, estaduais e municipais. Receita, INSS, TRT, polícia, tribunais e mais.</p>
              <div className="font-mono text-xs text-ink/70 pt-4 border-t-2 border-ink/15">
                <div className="flex justify-between mb-1"><span>Editais ativos</span><span className="font-bold">76</span></div>
                <div className="flex justify-between mb-1"><span>PDFs</span><span className="font-bold">10 mil+</span></div>
                <div className="flex justify-between mb-3"><span>Bancas</span><span className="font-bold">40+</span></div>
              </div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-3 transition-all">
                ESTUDAR PARA CONCURSOS →
              </div>
            </Link>

            <Link href="/oab" className="area-card bg-area-oab text-white rounded-2xl p-6 border-2 border-ink flex flex-col group">
              <div className="flex items-start justify-between mb-12">
                <div className="font-mono text-xs font-bold">№ 02</div>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-area-oab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">OAB</h3>
              <p className="text-sm text-white/85 leading-relaxed mb-5 flex-1">Exame de Ordem (FGV). 1ª fase + 2ª fase com curadoria de advogados aprovados.</p>
              <div className="font-mono text-xs text-white/80 pt-4 border-t-2 border-white/20">
                <div className="flex justify-between mb-1"><span>PDFs 1ª fase</span><span className="font-bold">2.624</span></div>
                <div className="flex justify-between mb-1"><span>Matérias</span><span className="font-bold">17</span></div>
                <div className="flex justify-between mb-3"><span>Peças treinadas</span><span className="font-bold">60+</span></div>
              </div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-3 transition-all">
                ESTUDAR PARA OAB →
              </div>
            </Link>

            <Link href="/militar" className="area-card bg-area-militar text-white rounded-2xl p-6 border-2 border-ink flex flex-col group">
              <div className="flex items-start justify-between mb-12">
                <div className="font-mono text-xs font-bold">№ 03</div>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-area-militar" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">Militar</h3>
              <p className="text-sm text-white/85 leading-relaxed mb-5 flex-1">EsPCEx, EEAR, AFA, EFOMM, EsSA, Colégio Naval e mais. Provas de carreira.</p>
              <div className="font-mono text-xs text-white/80 pt-4 border-t-2 border-white/20">
                <div className="flex justify-between mb-1"><span>Concursos</span><span className="font-bold">18</span></div>
                <div className="flex justify-between mb-1"><span>PDFs</span><span className="font-bold">1.840</span></div>
                <div className="flex justify-between mb-3"><span>TAF + intelectual</span><span className="font-bold">incluso</span></div>
              </div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-3 transition-all">
                ESTUDAR PARA MILITAR →
              </div>
            </Link>

            <Link href="/enem" className="area-card bg-area-enem text-white rounded-2xl p-6 border-2 border-ink flex flex-col group">
              <div className="flex items-start justify-between mb-12">
                <div className="font-mono text-xs font-bold">№ 04</div>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-area-enem" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">ENEM</h3>
              <p className="text-sm text-white/85 leading-relaxed mb-5 flex-1">4 áreas + Redação. Conteúdo alinhado à Matriz do INEP. SISU, ProUni e FIES.</p>
              <div className="font-mono text-xs text-white/80 pt-4 border-t-2 border-white/20">
                <div className="flex justify-between mb-1"><span>PDFs</span><span className="font-bold">1.739</span></div>
                <div className="flex justify-between mb-1"><span>Áreas + Redação</span><span className="font-bold">5</span></div>
                <div className="flex justify-between mb-3"><span>Simulados INEP</span><span className="font-bold">12</span></div>
              </div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-3 transition-all">
                ESTUDAR PARA ENEM →
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── PROBLEMA / SOLUÇÃO ── */}
      <section id="metodo" className="py-20 lg:py-28 bg-paper-2 dark:bg-ink-2 border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ por que a matriz funciona</span>
            <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.05]">
              Você não foi reprovado<br />
              por falta de estudo.<br />
              <span className="highlight-invert">Foi por estudar errado.</span>
            </h2>
            <p className="mt-6 text-lg text-ink/70 dark:text-paper/70 leading-relaxed">
              Todo concurseiro perde meses em PDFs gigantes e em matéria que <strong className="text-ink dark:text-paper">quase nunca cai</strong>. Quem passou estudou cirurgicamente o que a banca cobra. A diferença não é esforço — é estratégia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-paper dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-2xl p-7 lg:p-9">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink/60 dark:text-paper/60">/ sem a matriz</span>
                <span className="w-8 h-8 bg-ink dark:bg-paper/10 text-paper rounded-full flex items-center justify-center font-bold">✕</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-ink dark:text-paper mb-6">O ciclo da reprovação.</h3>
              <ul className="space-y-4 text-ink/80 dark:text-paper/80">
                <li className="flex gap-3"><span className="font-mono text-xs font-bold text-ink/40 dark:text-paper/40 mt-1">01</span><span>Ler edital de 200 páginas sem saber por onde começar</span></li>
                <li className="flex gap-3"><span className="font-mono text-xs font-bold text-ink/40 dark:text-paper/40 mt-1">02</span><span>Decorar leis e tópicos que a banca raramente cobra</span></li>
                <li className="flex gap-3"><span className="font-mono text-xs font-bold text-ink/40 dark:text-paper/40 mt-1">03</span><span>Comprar 12 livros físicos pra cobrir um único edital</span></li>
                <li className="flex gap-3"><span className="font-mono text-xs font-bold text-ink/40 dark:text-paper/40 mt-1">04</span><span>Reprovar por 2 pontos depois de 1 ano</span></li>
                <li className="flex gap-3"><span className="font-mono text-xs font-bold text-ink/40 dark:text-paper/40 mt-1">05</span><span>Recomeçar do zero, frustrado, gastando mais</span></li>
              </ul>
            </div>

            <div className="bg-ink text-paper border-2 border-ink rounded-2xl p-7 lg:p-9 relative overflow-hidden">
              <div className="absolute inset-0 matrix-grid-lime opacity-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-lime">/ com a matriz</span>
                  <span className="w-8 h-8 bg-lime text-ink rounded-full flex items-center justify-center font-bold">✓</span>
                </div>
                <h3 className="font-display font-bold text-2xl text-paper mb-6">O caminho mais curto.</h3>
                <ul className="space-y-4 text-paper/85">
                  <li className="flex gap-3"><span className="font-mono text-xs font-bold text-lime mt-1">01</span><span>A IA escaneia 10 anos da sua banca em segundos</span></li>
                  <li className="flex gap-3"><span className="font-mono text-xs font-bold text-lime mt-1">02</span><span>Mostra os tópicos com maior probabilidade de cair</span></li>
                  <li className="flex gap-3"><span className="font-mono text-xs font-bold text-lime mt-1">03</span><span>PDFs enxutos e diretos · só o que cai na sua banca</span></li>
                  <li className="flex gap-3"><span className="font-mono text-xs font-bold text-lime mt-1">04</span><span>Métricas em tempo real do seu desempenho</span></li>
                  <li className="flex gap-3"><span className="font-mono text-xs font-bold text-lime mt-1">05</span><span>1h de Matriz rende mais que 4h do método antigo</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-lime border-2 border-ink rounded-2xl p-8 lg:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="font-display font-bold text-7xl lg:text-8xl text-ink leading-none stat-num">3,2×</div>
            <div className="flex-1 text-center md:text-left">
              <div className="font-display font-bold text-xl lg:text-2xl text-ink mb-2">mais rendimento por hora de estudo</div>
              <div className="text-sm text-ink/70">Dados internos comparando alunos da Matriz com método tradicional de estudo (PDFs genéricos + apostilas de 800 páginas).</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FERRAMENTAS ── */}
      <section id="ferramentas" className="py-20 lg:py-28 bg-ink text-paper border-b-2 border-ink relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid-dark"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="label-tag text-lime border-lime/40 mb-5">◆ ferramentas</span>
              <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-paper leading-[1.05]">
                Quatro ferramentas.<br />
                Um único alvo: <span className="text-lime">aprovação.</span>
              </h2>
            </div>
            <p className="text-paper/60 max-w-sm">
              Cada ferramenta foi desenhada para tirar você do estudo genérico e te colocar no estudo que aprova.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="feature-tile bg-paper text-ink rounded-2xl p-6 border-2 border-ink">
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-xs font-bold text-ink/40">01/04</span>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl mb-2.5">Banca de Questões</h3>
              <p className="text-sm text-ink/65 leading-relaxed mb-5">Questões atualizadas, filtráveis por banca, ano, assunto e dificuldade. Todas comentadas.</p>
              <div className="font-mono text-xs text-ink/50 pt-4 border-t border-ink/10">CESPE · FGV · FCC · VUNESP · múltiplas bancas</div>
            </div>

            <div className="feature-tile bg-lime text-ink rounded-2xl p-6 border-2 border-ink relative">
              <span className="absolute -top-3 left-6 bg-ink text-lime font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">★ exclusivo</span>
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-xs font-bold text-ink/50">02/04</span>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl mb-2.5">IA Preditiva</h3>
              <p className="text-sm text-ink/75 leading-relaxed mb-5">O algoritmo da aprovação. Analisa anos de prova e prevê o que tem maior chance de cair.</p>
              <div className="font-mono text-xs text-ink/60 pt-4 border-t border-ink/20">precisão média: 89%</div>
            </div>

            <div className="feature-tile bg-paper text-ink rounded-2xl p-6 border-2 border-ink">
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-xs font-bold text-ink/40">03/04</span>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl mb-2.5">PDFs Cirúrgicos</h3>
              <p className="text-sm text-ink/65 leading-relaxed mb-5">Materiais enxutos de 10 a 30 páginas. Linguagem direta, esquemas visuais, sem encheção. Só o que cai.</p>
              <div className="font-mono text-xs text-ink/50 pt-4 border-t border-ink/10">Materiais · download liberado</div>
            </div>

            <div className="feature-tile bg-paper text-ink rounded-2xl p-6 border-2 border-ink">
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-xs font-bold text-ink/40">04/04</span>
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl mb-2.5">Simulados + Ranking</h3>
              <p className="text-sm text-ink/65 leading-relaxed mb-5">Simulados no estilo da banca com cronômetro real e ranking nacional. Saiba onde você está.</p>
              <div className="font-mono text-xs text-ink/50 pt-4 border-t border-ink/10">novos simulados toda semana</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── APROVADOS ── */}
      <section id="aprovados" className="py-20 lg:py-28 bg-paper-2 dark:bg-ink-2 border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div>
              <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ aprovados</span>
              <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.12]">
                Nome no <span className="highlight-lime">diário oficial.</span><br />
                Carreira no <span className="highlight-invert">serviço público.</span>
              </h2>
            </div>
            <div className="font-mono text-sm text-ink/60 dark:text-paper/60 lg:text-right">
              <div className="font-display font-bold text-3xl text-ink dark:text-paper stat-num">+4.812</div>
              <div>aprovados em 2024 e 2025</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-paper dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">/ depoimento 01</div>
                <div className="bg-lime border-2 border-ink rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink">APROVADA</div>
              </div>
              <p className="text-ink/80 dark:text-paper/80 leading-relaxed mb-6 flex-1">
                &ldquo;Eu trabalhava 8 horas por dia, e só tinha 2 horas pra estudar. A IA da Matriz mostrou que eu estava perdendo tempo com matéria que mal caía no concurso. Em <strong className="text-ink dark:text-paper">7 meses</strong>, consegui passar pra Receita Federal.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-5 border-t-2 border-ink/10 dark:border-paper/10">
                <div className="w-11 h-11 bg-area-concursos border-2 border-ink rounded-full flex items-center justify-center text-ink font-display font-bold">CM</div>
                <div>
                  <div className="font-display font-bold text-ink dark:text-paper text-sm">Carolina Mendes, 31</div>
                  <div className="font-mono text-[10px] text-ink/60 dark:text-paper/60 uppercase">Receita Federal · 2024</div>
                </div>
              </div>
            </div>

            <div className="bg-paper dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">/ depoimento 02</div>
                <div className="bg-lime border-2 border-ink rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink">APROVADO</div>
              </div>
              <p className="text-ink/80 dark:text-paper/80 leading-relaxed mb-6 flex-1">
                &ldquo;Eu já tinha reprovado 3 vezes por menos de 5 pontos. A Matriz clareou minha mente e me mostrou onde eu errava, estudava muito Constitucional e acabava não estuando quase nada de Administrativo. <strong className="text-ink dark:text-paper">TRT-RJ em 5 meses.</strong>&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-5 border-t-2 border-ink/10 dark:border-paper/10">
                <div className="w-11 h-11 bg-area-oab border-2 border-ink rounded-full flex items-center justify-center text-white font-display font-bold">RF</div>
                <div>
                  <div className="font-display font-bold text-ink dark:text-paper text-sm">Rafael Ferreira, 28</div>
                  <div className="font-mono text-[10px] text-ink/60 dark:text-paper/60 uppercase">TRT-RJ · 2023</div>
                </div>
              </div>
            </div>

            <div className="bg-paper dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">/ depoimento 03</div>
                <div className="bg-lime border-2 border-ink rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink">APROVADA · 11º</div>
              </div>
              <p className="text-ink/80 dark:text-paper/80 leading-relaxed mb-6 flex-1">
                &ldquo;Mãe de dois meninos, conseguia estudar apenas 1h30 na hora do almoço. Foquei nos PDFs curtos da Matriz e nos simulados, e a IA ajustava meu plano toda semana. Passei em <strong className="text-ink dark:text-paper">11º lugar</strong> no concurso da prefeitura! Recomendo muito caso não tenha tanto tempo livre, a Matriz se adaptou a minha rotina apertada, vai se adaptar a sua também.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-5 border-t-2 border-ink/10 dark:border-paper/10">
                <div className="w-11 h-11 bg-area-militar border-2 border-ink rounded-full flex items-center justify-center text-white font-display font-bold">JS</div>
                <div>
                  <div className="font-display font-bold text-ink dark:text-paper text-sm">Juliana Souza, 36</div>
                  <div className="font-mono text-[10px] text-ink/60 dark:text-paper/60 uppercase">Pref. Curitiba · 2024</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PREÇO ── */}
      <section id="preco" className="py-20 lg:py-28 bg-ink text-paper relative overflow-hidden border-b-2 border-ink">
        <div className="absolute inset-0 matrix-grid-dark"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 mb-12 items-end">
            <div className="lg:col-span-7">
              <span className="label-tag text-lime border-lime/40 mb-5">◆ investimento</span>
              <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-paper leading-[1.05]">
                Um preço.<br />
                <span className="text-lime">Acesso total.</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:text-right">
              <p className="text-lg text-paper/70 leading-relaxed max-w-sm lg:ml-auto">
                Sem planos confusos, sem mensalidade, sem surpresa no cartão.<br />
                Um pagamento e <strong className="text-paper">pronto</strong>.
              </p>
            </div>
          </div>

          <div className="bg-paper text-ink rounded-2xl border-2 border-ink overflow-hidden">

            <div className="px-6 lg:px-10 py-5 border-b-2 border-ink flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink/50">№ 01 / único</span>
                <span className="font-mono text-xs uppercase tracking-widest text-ink/30">·</span>
                <span className="font-display font-bold text-lg">PLANO VITALÍCIO MATRIZ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-ink text-lime font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">⚡ economia 83%</span>
                <span className="font-mono text-xs uppercase tracking-widest text-ink/50 hidden sm:inline">vitalício</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 px-6 lg:px-10 py-8 lg:py-10 border-b-2 border-ink/10">
              <div className="lg:col-span-5">
                <div className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-3">/ pagamento único</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-xl text-ink/30 line-through stat-num">R$ 297</span>
                </div>
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="font-display text-2xl font-bold text-ink">R$</span>
                  <span className="font-display text-7xl sm:text-8xl lg:text-9xl font-bold text-ink stat-num">49</span>
                  <span className="font-display text-3xl font-bold text-ink">,99</span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="font-mono text-xs text-ink/70">pagamento único · pix ou cartão</div>
                  <div className="font-mono text-xs text-ink/70">ou 12× de R$ 4,17 no cartão</div>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 bg-lime border-2 border-ink px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-mono text-xs font-bold text-ink uppercase tracking-widest">só R$ 4,17 por mês</span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">/ inclui · tudo liberado</div>
                <div className="divide-y divide-ink/10 border-y-2 border-ink/10">
                  {[
                    ["01", <>Acesso às <strong>4 áreas</strong> (Concursos, OAB, Militar, ENEM)</>],
                    ["02", <>Banco de <strong>questões</strong> comentadas</>],
                    ["03", <><strong>Materiais em PDF</strong> cirúrgicos</>],
                    ["04", <><strong>IA Preditiva</strong> da sua banca</>],
                    ["05", "Simulados com ranking nacional"],
                    ["06", "Plano de estudos personalizado"],
                    ["07", "Mobile + desktop · estuda em qualquer lugar"],
                    ["08", "Garantia incondicional de 7 dias"],
                  ].map(([num, desc]) => (
                    <div key={String(num)} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-ink/40">{num}</span>
                        <span className="text-ink/90">{desc}</span>
                      </div>
                      <span className="font-mono text-xs text-ink/50">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-paper-2 px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/assinar" className="cta-primary flex-1 inline-flex items-center justify-center gap-3 bg-lime text-ink font-display font-bold text-lg lg:text-xl px-7 py-5 rounded-xl border-2 border-ink">
                QUERO GARANTIR MEU ACESSO
                <span className="font-mono text-xl">→</span>
              </Link>
              <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 bg-paper text-ink font-display font-bold text-base px-6 py-5 rounded-xl border-2 border-ink whitespace-nowrap hover:bg-ink hover:text-lime transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                TESTAR GRÁTIS
              </Link>
            </div>

            <div className="px-6 lg:px-10 py-4 border-t-2 border-ink/10 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-ink/50 uppercase tracking-widest">
              <div className="flex flex-wrap items-center gap-3">
                <span>🔒 pagamento seguro</span><span>·</span>
                <span>pix · cartão de crédito</span><span>·</span>
                <span>sem renovação automática</span>
              </div>
              <div>matriz aprova · v2026</div>
            </div>
          </div>

          <p className="text-center font-mono text-xs text-paper/40 uppercase tracking-widest mt-8">
            ⚠ oferta por tempo limitado · valor cheio volta a r$ 297
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 lg:py-28 bg-paper dark:bg-ink-2 border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-40"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ faq</span>
            <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.05]">
              Toda dúvida tem<br />
              <span className="highlight-invert">uma resposta direta.</span>
            </h2>
          </div>

          <div className="space-y-3">
            {([
              ["Posso testar antes de pagar?", 'Sim! Temos um plano gratuito de demonstração com acesso limitado a PDFs e questões. Não precisa de cartão. É só clicar em "Testar grátis" e você entra no app na mesma hora.'],
              ["Por quanto tempo eu tenho acesso?", "Acesso vitalício. Você paga uma vez e usa o plano para sempre, sem qualquer limite: questões, PDFs, simulados, IA e métricas. Vale para as 4 áreas."],
              ["Posso estudar para mais de uma área?", "Sim. Com 1 pagamento você libera Concursos, OAB, Militar e ENEM simultaneamente. Sem limite de acesso entre áreas."],
              ["Quais são as formas de pagamento?", "PIX (liberação imediata) e cartão de crédito em até 12x. Pagamento processado pela InfinitePay, com liberação automática do acesso."],
              ["As questões e PDFs são atualizados?", "Sim. Toda semana incluímos novas questões assim que novas provas são aplicadas. Os PDFs são revisados a cada mudança de legislação ou edital."],
              ["E se eu não gostar? Tem reembolso?", "Sim, sem burocracia. 7 dias de garantia incondicional. Não gostou, devolvemos 100% do valor — sem perguntas."],
              ["Como a IA me ajuda na prática?", "A IA analisa milhares de provas anteriores da sua banca, identifica os tópicos mais cobrados e cruza com seu desempenho. Ela te diz exatamente o que estudar hoje para maximizar seus acertos."],
              ["Posso acessar pelo celular?", "Sim. Plataforma 100% responsiva em celulares, tablets e computadores. Estude no transporte, no almoço, onde quiser."],
            ] as [string, string][]).map(([q, a]) => (
              <details key={q} className="bg-paper-2 dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-xl">
                <summary className="flex justify-between items-center gap-4 p-5">
                  <span className="font-display font-bold text-ink dark:text-paper text-lg">{q}</span>
                  <span className="faq-toggle w-9 h-9 flex-shrink-0 bg-ink dark:bg-paper/10 text-paper rounded-full flex items-center justify-center font-bold text-xl">+</span>
                </summary>
                <div className="px-5 pb-5 text-ink/75 dark:text-paper/75 leading-relaxed border-t-2 border-ink/10 dark:border-paper/10 pt-4 mx-5">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-lime border-b-2 border-ink relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-30"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <span className="label-tag text-ink border-ink/40 mb-6">◆ a próxima coordenada é sua</span>
          <h2 className="mt-5 font-display font-bold text-4xl sm:text-5xl lg:text-7xl text-ink leading-[1]">
            R$ 49,99 hoje.<br />
            Um <span className="bg-ink text-lime px-3">salário público</span> amanhã.
          </h2>
          <p className="mt-6 text-lg text-ink/80 max-w-xl mx-auto">
            Faz a conta. Ou testa grátis primeiro.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link href="/assinar" className="cta-primary inline-flex items-center justify-center gap-3 bg-ink text-lime font-display font-bold text-lg px-8 py-5 rounded-xl border-2 border-ink">
              QUERO COMEÇAR AGORA
              <span className="font-mono">→</span>
            </Link>
            <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 bg-lime text-ink font-display font-bold text-base px-7 py-5 rounded-xl border-2 border-ink hover:bg-ink hover:text-lime transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              TESTAR GRÁTIS
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-ink text-paper/70 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-5">
              <Link href="/" className="flex items-center gap-2.5 mb-5">
                <span className="rounded-md bg-paper p-1.5">
                  <Logo className="h-7 w-auto" sempreClaro />
                </span>
              </Link>
              <p className="text-sm leading-relaxed max-w-md">
                A plataforma brasileira de estudos para Concursos, OAB, Militar e ENEM que usa Inteligência Artificial para mostrar exatamente o que você precisa estudar para passar.
              </p>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-mono text-xs uppercase tracking-widest text-lime mb-4">/ áreas</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/concursos" className="hover:text-paper transition">Concursos Públicos →</Link></li>
                <li><Link href="/oab" className="hover:text-paper transition">OAB →</Link></li>
                <li><Link href="/militar" className="hover:text-paper transition">Militar →</Link></li>
                <li><Link href="/enem" className="hover:text-paper transition">ENEM →</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-mono text-xs uppercase tracking-widest text-lime mb-4">/ matriz</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/cadastro" className="hover:text-paper transition">Testar grátis →</Link></li>
                <li><Link href="/login" className="hover:text-paper transition">Acessar app →</Link></li>
                <li><Link href="/termos" className="hover:text-paper transition">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-paper transition">Política de Privacidade</Link></li>
                <li><a href="mailto:suporte@matrizaprova.com" className="hover:text-paper transition">suporte@matrizaprova.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-paper/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono text-[11px] text-paper/50 uppercase tracking-widest">
            <div>
              © 2026 matriz aprova · todos os direitos reservados<br />
              <span className="normal-case tracking-normal">MATRIZ APROVA TECNOLOGIA EDUCACIONAL LTDA · CNPJ: 54.892.317/0001-43</span>
            </div>
            <div className="text-paper/40">matrizaprova.com</div>
          </div>
        </div>
      </footer>

    </div>
  )
}
