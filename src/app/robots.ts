import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/cadastro", "/recuperar-senha"],
        disallow: ["/dashboard", "/questoes", "/simulados", "/materiais", "/plano", "/editais", "/estatisticas", "/admin", "/onboarding"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
