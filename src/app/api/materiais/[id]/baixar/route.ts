import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * GET /api/materiais/[id]/baixar
 *
 * Gera a signed URL do PDF do material. Só o plano vitalício pode
 * baixar materiais — o demo recebe 403 e o front mostra o upgrade.
 * A URL é criada com a chave de serviço, que ignora RLS.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: perfil } = await service
    .from("profiles")
    .select("plano")
    .eq("id", user.id)
    .single()

  if (perfil?.plano !== "vitalicio") {
    return NextResponse.json(
      {
        error: "Materiais em PDF estão disponíveis no plano vitalício.",
        precisaPlano: true,
      },
      { status: 403 }
    )
  }

  const { data: material } = await service
    .from("materials")
    .select("id, titulo, pdf_url")
    .eq("id", params.id)
    .single()

  if (!material?.pdf_url) {
    return NextResponse.json({ error: "Material não encontrado" }, { status: 404 })
  }

  const { data: urlData, error } = await service.storage
    .from("materiais")
    .createSignedUrl(material.pdf_url, 60)

  if (error || !urlData?.signedUrl) {
    console.error("materiais: erro ao gerar signed URL", error)
    return NextResponse.json({ error: "Falha ao gerar o link do material" }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: urlData.signedUrl, titulo: material.titulo })
}
