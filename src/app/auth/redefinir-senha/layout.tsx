import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Definir nova senha",
  description: "Escolha uma nova senha para acessar sua conta na Matriz Aprova.",
}

export default function RedefinirSenhaLayout({ children }: { children: React.ReactNode }) {
  return children
}
