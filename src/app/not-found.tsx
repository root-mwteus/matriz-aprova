import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-dots bg-[length:20px_20px]">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-accent">404</h1>
        <p className="text-xl text-muted">Página não encontrada</p>
        <Link
          href="/"
          className="inline-block bg-accent text-accent-foreground font-bold px-8 py-3 rounded-card hover:opacity-90 transition-opacity"
        >
          VOLTAR AO INÍCIO
        </Link>
      </div>
    </div>
  )
}
