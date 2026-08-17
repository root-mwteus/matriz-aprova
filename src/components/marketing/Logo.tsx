import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Matriz Aprova"
      width={680}
      height={128}
      priority
      className={cn("h-auto w-auto", className)}
    />
  )
}