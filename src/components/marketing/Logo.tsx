import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Logo do site, em duas versões de cor: uma para o tema claro
 * (`matrizaprova_temaclaro.png`) e outra para o escuro
 * (`matrizaprova_temaescuro.png`). A troca é por CSS (`dark:`), igual ao
 * ThemeToggle — o componente não precisa saber o tema em runtime.
 *
 * `sempreClaro` força a versão clara: usada nos rodapés, onde o logo
 * sempre fica sobre um fundo `bg-paper` independente do tema.
 */
export function Logo({
  className,
  sempreClaro = false,
}: {
  className?: string
  sempreClaro?: boolean
}) {
  if (sempreClaro) {
    return (
      <Image
        src="/matrizaprova_temaclaro.png"
        alt="Matriz Aprova"
        width={601}
        height={220}
        priority
        className={cn("h-auto w-auto", className)}
      />
    )
  }

  return (
    <>
      <Image
        src="/matrizaprova_temaclaro.png"
        alt="Matriz Aprova"
        width={601}
        height={220}
        priority
        className={cn("h-auto w-auto dark:hidden", className)}
      />
      <Image
        src="/matrizaprova_temaescuro.png"
        alt="Matriz Aprova"
        width={601}
        height={220}
        priority
        className={cn("hidden h-auto w-auto dark:block", className)}
      />
    </>
  )
}