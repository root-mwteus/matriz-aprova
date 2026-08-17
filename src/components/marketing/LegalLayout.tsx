import Link from "next/link"
import type { ReactNode } from "react"
import { Logo } from "@/components/marketing/Logo"
import { ThemeToggle } from "@/components/marketing/ThemeToggle"

export function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans bg-paper dark:bg-ink min-h-screen">
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
              <a href="/#preco" className="hover:text-ink dark:hover:text-paper transition">Preço</a>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:inline-flex font-mono text-xs font-semibold border-2 border-ink dark:border-paper/30 px-3 py-2 rounded-md cta-ghost items-center gap-1.5 text-ink dark:text-paper">
                Acessar app
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-ink/80 dark:text-paper/80">
        {children}
      </main>

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
