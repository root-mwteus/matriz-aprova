import Link from "next/link"
import { ThemeToggle } from "@/components/marketing/ThemeToggle"

const COLOR = "#3D8B3D"
const COLOR_TEXT = "#FFFFFF"

export const metadata = {
  title: "Matriz Aprovação · Militar",
  description: "Plataforma de estudos para concursos militares com IA preditiva. EsPCEx, EEAR, AFA, EFOMM, EsSA, Colégio Naval e 12 carreiras.",
}

export default function MilitarPage() {
  return (
    <div className="font-sans bg-paper dark:bg-ink min-h-screen">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-paper/90 dark:bg-ink/90 backdrop-blur border-b-2 border-ink dark:border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: COLOR }}>
                <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                  <div className="bg-white/30 rounded-sm"></div>
                  <div className="bg-white/30 rounded-sm"></div>
                  <div className="bg-white/30 rounded-sm"></div>
                  <div className="bg-white rounded-sm"></div>
                </div>
              </div>
              <div className="leading-none">
                <div className="font-display font-bold text-lg text-ink dark:text-paper">matriz<span style={{ color: COLOR }}>.</span></div>
                <div className="font-mono text-[9px] text-ink/60 dark:text-paper/50 uppercase tracking-widest">concursos militares</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70 dark:text-paper/70">
              <Link href="/concursos" className="hover:text-ink dark:hover:text-paper transition">Concursos</Link>
              <Link href="/oab" className="hover:text-ink dark:hover:text-paper transition">OAB</Link>
              <Link href="/militar" className="text-ink dark:text-paper font-bold">Militar</Link>
              <Link href="/enem" className="hover:text-ink dark:hover:text-paper transition">ENEM</Link>
              <span className="text-ink/20 dark:text-paper/20">|</span>
              <a href="/#preco" className="hover:text-ink dark:hover:text-paper transition">Preço</a>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:inline-flex font-mono text-xs font-semibold text-ink dark:text-paper border-2 border-ink dark:border-paper/30 px-3 py-2 rounded-md cta-ghost items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                ACESSAR APP
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMB ── */}
      <div className="border-b-2 border-ink" style={{ background: COLOR, color: COLOR_TEXT }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 font-mono text-xs">
          <Link href="/" className="hover:underline opacity-70">matriz.aprovação</Link>
          <span className="opacity-50">/</span>
          <span className="font-bold uppercase tracking-widest">concursos militares</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative bg-paper dark:bg-ink overflow-hidden border-b-2 border-ink dark:border-paper/10">
        <div className="absolute inset-0 matrix-grid"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">

            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 border-2 border-ink px-3 py-1.5 rounded-full mb-6" style={{ background: COLOR, color: COLOR_TEXT }}>
                <span className="w-1.5 h-1.5 rounded-full pulse-soft bg-white"></span>
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest font-bold">Da prova intelectual ao TAF.</span>
              </div>

              <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-ink dark:text-paper leading-[0.95]">
                Sua aprovação<br />
                em <span style={{ background: COLOR, color: COLOR_TEXT, padding: '0 8px' }}>Militar</span><br />
                começa aqui.
              </h1>

              <p className="mt-7 text-lg text-ink/70 dark:text-paper/70 max-w-xl leading-relaxed">
                EsPCEx, EEAR, AFA, EFOMM, EsSA, Colégio Naval e mais 12 carreiras. Conteúdo das matérias + preparação completa para o Teste de Aptidão Física.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
                <a href="/#preco" className="cta-primary inline-flex items-center justify-center gap-3 font-display font-bold text-base px-7 py-4 rounded-lg border-2 border-ink" style={{ background: COLOR, color: COLOR_TEXT }}>
                  GARANTIR ACESSO · R$ 89,99 <span className="font-mono">→</span>
                </a>
                <Link href="/cadastro" className="cta-secondary inline-flex items-center justify-center gap-2 bg-paper dark:bg-transparent text-ink dark:text-paper font-display font-bold text-base px-7 py-4 rounded-lg border-2 border-ink dark:border-paper/50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  TESTAR GRÁTIS
                </Link>
              </div>

              <div className="mt-3 font-mono text-xs text-ink/50 dark:text-paper/50">sem cartão · acesso ao app imediato · com limitações no plano demo</div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-ink/60 dark:text-paper/60">
                <span>✓ 4 áreas no mesmo acesso</span>
                <span>✓ 7 dias de garantia</span>
                <span>✓ Pagamento único</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-ink text-paper rounded-2xl border-2 border-ink relative overflow-hidden">
                <div className="absolute inset-0 matrix-grid-dark"></div>
                <div className="relative flex items-center justify-between px-5 py-3 border-b border-paper/10 bg-ink-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-paper/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-paper/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-paper/20"></div>
                  </div>
                  <div className="font-mono text-[10px] text-paper/50">app.matrizaprova.com / militar</div>
                  <div className="font-mono text-[10px]" style={{ color: COLOR }}>● online</div>
                </div>

                <div className="relative p-5 space-y-3">
                  <div className="bg-ink-2 rounded-xl p-4 border border-paper/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-sm" style={{ background: COLOR, color: COLOR_TEXT }}>LP</div>
                        <div>
                          <div className="text-sm font-semibold text-paper leading-tight">Olá, Lucas</div>
                          <div className="font-mono text-[10px] text-paper/50">aspirante · EsPCEx</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-xl stat-num leading-none" style={{ color: COLOR }}>14</div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-paper/50">dias</div>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-8 mt-2">
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '35%', animationDelay: '.05s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '60%', animationDelay: '.1s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '45%', animationDelay: '.15s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '70%', animationDelay: '.2s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '55%', animationDelay: '.25s' }}></div>
                      <div className="flex-1 bg-paper/15 rounded-sm mini-bar" style={{ height: '80%', animationDelay: '.3s' }}></div>
                      <div className="flex-1 rounded-sm mini-bar" style={{ height: '100%', animationDelay: '.35s', background: COLOR }}></div>
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-paper/40 mt-1.5 uppercase">
                      <span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                      <span className="font-bold" style={{ color: COLOR }}>D · hoje</span>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 relative overflow-hidden scan-line" style={{ background: COLOR, color: COLOR_TEXT }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-70">📄 próximo material · sugerido pela ia</div>
                      <div className="bg-ink font-mono text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ color: COLOR }}>83% CAI</div>
                    </div>
                    <div className="font-display font-bold text-lg leading-tight mb-1">Matemática · Trigonometria</div>
                    <div className="text-xs opacity-70 mb-3">Lei dos Senos e Cossenos · EsPCEx · PDF</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs opacity-80 font-semibold">22 páginas · Prof. Henrique Sá</span>
                      <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" style={{ color: COLOR }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-ink-2 rounded-xl border border-paper/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-paper/10">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-paper/60 font-semibold">/ questões · hoje</div>
                      <div className="font-mono text-[10px] stat-num" style={{ color: COLOR }}>77% acerto</div>
                    </div>
                    <div className="divide-y divide-paper/5">
                      {[
                        { ok: true, text: "Razões trigonométricas", sub: "EsPCEx · 2023" },
                        { ok: true, text: "Lei dos Cossenos · aplicações", sub: "EEAR · 2024" },
                        { ok: false, text: "Questão para revisar", sub: "EsPCEx · revisar" },
                      ].map((q, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: q.ok ? `${COLOR}33` : '#E6394633' }}>
                            {q.ok
                              ? <svg className="w-3 h-3" style={{ color: COLOR }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              : <svg className="w-3 h-3 text-area-oab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs truncate ${q.ok ? 'text-paper' : 'text-paper/70'}`}>{q.text}</div>
                            <div className="font-mono text-[9px] text-paper/40">{q.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between font-mono text-[10px] text-ink/40 dark:text-paper/40 px-2">
                <span>[ MATRIZ.v2026 · militar ]</span>
                <Link href="/cadastro" className="hover:text-ink dark:hover:text-paper underline underline-offset-2">testar agora →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NÚMEROS ── */}
      <section className="border-b-2 border-ink" style={{ background: COLOR, color: COLOR_TEXT }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            ["18", "concursos militares cobertos"],
            ["1.840", "PDFs estruturados por carreira"],
            ["TAF", "guia completo de aptidão física"],
            ["+200", "novas questões militares por semana"],
          ].map(([val, label], i) => (
            <div key={i}>
              <div className="font-mono text-xs uppercase tracking-widest opacity-60 mb-1">№ 0{i + 1}</div>
              <div className="font-display font-bold text-4xl lg:text-5xl stat-num">{val}</div>
              <div className="text-sm mt-1 opacity-80">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRILHAS ── */}
      <section id="trilha" className="py-20 lg:py-28 bg-paper dark:bg-ink border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ trilhas e conteúdo</span>
              <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.05]">
                18 carreiras.<br />
                <span style={{ background: COLOR, color: COLOR_TEXT, padding: '0 8px' }}>1 plataforma.</span>
              </h2>
            </div>
            <p className="text-ink/60 dark:text-paper/60 max-w-sm">
              De Exército, Marinha e Aeronáutica — cada concurso tem trilha própria com conteúdo específico do edital.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              ["EsPCEx", "Escola Preparatória de Cadetes do Exército", "Anual · Exército"],
              ["EEAR", "Escola de Especialistas da Aeronáutica", "2x/ano · Aeronáutica"],
              ["AFA", "Academia da Força Aérea", "Anual · Aeronáutica"],
              ["EFOMM", "Escola de Formação de Oficiais da Marinha", "Anual · Marinha"],
              ["EsSA", "Escola de Sargentos das Armas", "Anual · Exército"],
              ["Colégio Naval", "Formação de Guardas-Marinha", "Anual · Marinha"],
            ].map(([name, desc, badge]) => (
              <div key={name} className="feature-tile bg-paper dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: COLOR }}>
                    <svg className="w-5 h-5" style={{ color: COLOR_TEXT }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">{badge}</span>
                </div>
                <h4 className="font-display font-bold text-lg text-ink dark:text-paper mb-1">{name}</h4>
                <div className="text-sm text-ink/60 dark:text-paper/60">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="font-mono text-xs uppercase tracking-widest text-ink/50 dark:text-paper/50 mb-3">/ bancas e organizadores</div>
            <div className="flex flex-wrap gap-2">
              {["EsPCEx (Exército)", "EEAR (Aeronáutica)", "AFA (Aeronáutica)", "EFOMM (Marinha)", "EsSA (Sargento)", "Colégio Naval", "EPCAR", "CFO PM"].map((b) => (
                <span key={b} className="font-mono text-xs px-3 py-1.5 border border-ink/20 dark:border-paper/20 rounded-full text-ink/70 dark:text-paper/70">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── IA ── */}
      <section className="py-20 lg:py-28 bg-ink text-paper border-b-2 border-ink relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid-dark"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="label-tag mb-5" style={{ color: COLOR, borderColor: `${COLOR}66` }}>◆ ia preditiva · militar</span>
            <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-paper leading-[1.05]">
              Treinada especificamente<br />
              para a sua <span style={{ color: COLOR }}>Militar</span>.
            </h2>
            <p className="mt-6 text-lg text-paper/70 leading-relaxed">A IA não é genérica. Cada carreira tem conteúdo específico do edital — da matemática da EsPCEx ao inglês da AFA.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              ["/ passo 01", "Análise do edital", "A IA mapeia o edital específico da carreira que você escolheu e identifica as matérias com maior peso histórico.",
                <svg key="i1" className="w-6 h-6" style={{ color: '#0E1117' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>],
              ["/ passo 02", "Diagnóstico de você", "Cruza seu desempenho com o que a banca cobra. Resultado: um mapa de onde você está perdendo pontos nas provas.",
                <svg key="i2" className="w-6 h-6" style={{ color: '#0E1117' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>],
              ["/ passo 03", "Plano cirúrgico", "Gera plano diário com o que estudar, quais questões resolver e quando intensificar para a prova. Inclui guia de TAF.",
                <svg key="i3" className="w-6 h-6" style={{ color: '#0E1117' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>],
            ].map(([step, title, desc, icon]) => (
              <div key={String(step)} className="bg-ink-2 border-2 border-paper/10 rounded-2xl p-7">
                <div className="font-mono text-xs text-paper/50 uppercase tracking-widest mb-3">{step}</div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: COLOR }}>{icon}</div>
                <h3 className="font-display font-bold text-xl text-paper mb-2">{title}</h3>
                <p className="text-sm text-paper/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APROVADOS ── */}
      <section className="py-20 lg:py-28 bg-paper-2 dark:bg-ink-2 border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-3xl">
            <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ quem passou em Militar</span>
            <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.05]">
              Eles confiaram na <span style={{ background: COLOR, color: COLOR_TEXT, padding: '0 8px' }}>Matriz.</span><br />
              Hoje servem ao <span style={{ background: COLOR, color: COLOR_TEXT, padding: '0 8px' }}>Brasil.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { badge: "APROVADO", text: '"Estudei 8 meses com a Matriz para a EsPCEx. A IA sabia exatamente quais tópicos de Matemática a prova cobrava. Passei na primeira tentativa."', initials: "LP", name: "Lucas Pereira, 19", role: "EsPCEx · 2024" },
              { badge: "APROVADO", text: '"Para a EEAR, o conteúdo de Física era o mais pesado. A Matriz me deu os PDFs certos e questões de provas anteriores. Aprovado em 6 meses."', initials: "GA", name: "Gabriel Andrade, 18", role: "EEAR · 2024" },
              { badge: "APROVADA", text: '"Fui a primeira mulher da minha cidade a passar para a AFA. A Matriz me ajudou a focar no que a prova cobra de verdade — sem desperdiçar tempo."', initials: "LN", name: "Larissa Nogueira, 20", role: "AFA · 2024" },
            ].map((t, i) => (
              <div key={i} className="bg-paper dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-2xl p-6 flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">/ depoimento 0{i + 1}</div>
                  <div className="border-2 border-ink rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold" style={{ background: COLOR, color: COLOR_TEXT }}>{t.badge}</div>
                </div>
                <p className="text-ink/80 dark:text-paper/80 leading-relaxed mb-6 flex-1">{t.text}</p>
                <div className="flex items-center gap-3 pt-5 border-t-2 border-ink/10 dark:border-paper/10">
                  <div className="w-11 h-11 border-2 border-ink rounded-full flex items-center justify-center font-display font-bold" style={{ background: COLOR, color: COLOR_TEXT }}>{t.initials}</div>
                  <div>
                    <div className="font-display font-bold text-ink dark:text-paper text-sm">{t.name}</div>
                    <div className="font-mono text-[10px] text-ink/60 dark:text-paper/60 uppercase">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 lg:py-28 border-b-2 border-ink relative overflow-hidden" style={{ background: COLOR, color: COLOR_TEXT }}>
        <div className="absolute inset-0 matrix-grid opacity-20"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="label-tag mb-6" style={{ borderColor: `${COLOR_TEXT}66` }}>◆ 1 plano · 4 áreas</span>
          <h2 className="mt-5 font-display font-bold text-4xl sm:text-5xl lg:text-7xl leading-[1]">
            R$ 89,99 hoje.<br />
            Sua vaga em Militar <span style={{ background: COLOR_TEXT, color: COLOR, padding: '0 12px' }}>amanhã.</span>
          </h2>
          <p className="mt-6 text-lg opacity-80 max-w-xl mx-auto">Pagamento único anual. Acesso liberado também para Concursos, OAB e ENEM.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <a href="/#preco" className="cta-primary inline-flex items-center justify-center gap-3 font-display font-bold text-lg px-8 py-5 rounded-xl border-2 border-white/30" style={{ background: COLOR_TEXT, color: COLOR }}>
              QUERO COMEÇAR AGORA <span className="font-mono">→</span>
            </a>
            <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 font-display font-bold text-base px-7 py-5 rounded-xl border-2 border-white/30 transition hover:opacity-80" style={{ background: COLOR, color: COLOR_TEXT }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              TESTAR GRÁTIS
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 lg:py-28 bg-paper dark:bg-ink-2 border-b-2 border-ink dark:border-paper/10 relative overflow-hidden">
        <div className="absolute inset-0 matrix-grid opacity-40"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="label-tag text-ink dark:text-paper border-ink/20 dark:border-paper/20 mb-5">◆ faq · militar</span>
            <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-paper leading-[1.05]">
              Dúvidas sobre<br />
              <span style={{ background: COLOR, color: COLOR_TEXT, padding: '0 8px' }}>Militar.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {([
              ["A Matriz prepara para o TAF?", "Sim. Temos módulo completo de Teste de Aptidão Física com tabelas de corte por carreira, planilhas de treino e orientações nutricionais. O TAF é cobrado junto com a prova intelectual — a Matriz cobre os dois."],
              ["Quais concursos militares estão cobertos?", "18 carreiras: EsPCEx, EEAR, AFA, EFOMM, EsSA, Colégio Naval, EPCAR, CFO PM (estaduais) e mais. Se o concurso tem edital recorrente, está na Matriz."],
              ["Posso testar antes de pagar?", 'Sim. Temos um plano gratuito de demonstração com acesso limitado a PDFs e questões. Não precisa de cartão. É só clicar em "Testar grátis" e você entra no app na mesma hora.'],
              ["Por quanto tempo eu tenho acesso?", "12 meses completos. Com 1 pagamento você libera as 4 áreas (Concursos, OAB, Militar, ENEM)."],
              ["E se eu não gostar? Tem reembolso?", "Sim. 7 dias de garantia incondicional. Devolvemos 100%, sem perguntas."],
            ] as [string, string][]).map(([q, a]) => (
              <details key={q} className="bg-paper-2 dark:bg-ink-3 border-2 border-ink dark:border-paper/20 rounded-xl">
                <summary className="flex justify-between items-center gap-4 p-5">
                  <span className="font-display font-bold text-ink dark:text-paper text-lg">{q}</span>
                  <span className="faq-toggle w-9 h-9 flex-shrink-0 bg-ink dark:bg-paper/10 text-paper rounded-full flex items-center justify-center font-bold text-xl">+</span>
                </summary>
                <div className="px-5 pb-5 text-ink/75 dark:text-paper/75 leading-relaxed border-t-2 border-ink/10 dark:border-paper/10 pt-4 mx-5">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-ink text-paper/70 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-5">
              <Link href="/" className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: COLOR }}>
                  <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                    <div className="bg-white/30 rounded-sm"></div>
                    <div className="bg-white/30 rounded-sm"></div>
                    <div className="bg-white/30 rounded-sm"></div>
                    <div className="bg-white rounded-sm"></div>
                  </div>
                </div>
                <div className="leading-none">
                  <div className="font-display font-bold text-lg text-paper">matriz<span style={{ color: COLOR }}>.</span></div>
                  <div className="font-mono text-[9px] text-paper/50 uppercase tracking-widest">concursos militares</div>
                </div>
              </Link>
              <p className="text-sm leading-relaxed max-w-md">Plataforma brasileira de estudos com IA preditiva para Concursos, OAB, Militar e ENEM.</p>
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
                <li><a href="#" className="hover:text-paper transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-paper transition">Política de Privacidade</a></li>
                <li><a href="mailto:suporte@matrizaprova.com" className="hover:text-paper transition">suporte@matrizaprova.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-paper/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono text-[11px] text-paper/50 uppercase tracking-widest">
            <div>© 2026 matriz aprovação<br /><span className="normal-case tracking-normal">MATRIZ APROVAÇÃO TECNOLOGIA EDUCACIONAL LTDA · CNPJ: 54.892.317/0001-43</span></div>
            <div className="text-paper/40">matrizaprova.com</div>
          </div>
        </div>
      </footer>

    </div>
  )
}
