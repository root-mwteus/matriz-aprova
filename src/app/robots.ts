import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"
import { AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...PUBLIC_ROUTES, ...AUTH_ROUTES],
        // A área logada nunca é indexável. A lista vem de lib/routes para
        // não esquecer nenhuma rota nova.
        disallow: [...PROTECTED_ROUTES, "/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
