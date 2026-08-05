import { Resend } from "resend"

// Init lazy: o construtor do Resend lança exceção síncrona sem API key.
// Este módulo é importado pelo /auth/callback, que não pode quebrar só
// porque o Resend ainda não foi configurado.
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

// Em produção envia do domínio verificado. Se o Resend recusar com
// "domain is not verified", falta adicionar o domínio e os registros DNS
// em https://resend.com/domains (verificado a partir do código em 03/08).
const FROM = process.env.NODE_ENV === "production"
  ? "Matriz Aprovação <noreply@matrizaprova.com>"
  : "Matriz Aprovação <onboarding@resend.dev>"

export async function sendBoasVindas({
  nome,
  email,
  area,
}: {
  nome: string
  email: string
  area: string
}) {
  const resend = getResend()
  if (!resend) {
    return { data: null, error: new Error("Resend não configurado (RESEND_API_KEY ausente)") }
  }
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${nome}, sua conta na Matriz Aprovação está pronta`,
    headers: {
      "List-Unsubscribe": "<mailto:suporte@matrizaprova.com?subject=Descadastrar>",
    },
    text: boasVindasText(nome, area),
    html: boasVindasHtml(nome, area),
  })
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function boasVindasText(nome: string, area: string) {
  return `Olá, ${nome}!

Sua conta na Matriz Aprovação está pronta e você já está no modo ${area}.

Comece por aqui:
· Banco de questões comentadas das principais bancas
· PDFs cirúrgicos de 10 a 30 páginas com o que realmente cai
· IA preditiva mapeando o padrão da sua banca
· Simulados com ranking nacional

Acesse o app: https://matrizaprova.com/dashboard

Você está no plano demo — explore à vontade. Quando quiser liberar as 4 áreas com acesso vitalício, basta um único pagamento na página Assinar.

Se você não criou esta conta, ignore este email.

---
Matriz Aprovação Tecnologia Educacional LTDA · CNPJ 54.892.317/0001-43
suporte@matrizaprova.com · matrizaprova.com`
}

function boasVindasHtml(nome: string, area: string) {
  const nomeEsc = esc(nome)
  const areaEsc = esc(area)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Bem-vindo à Matriz Aprovação</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE9E0;font-family:Arial,Helvetica,sans-serif;color:#0E1117">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
    Sua conta na Matriz Aprovação está pronta. Comece a estudar agora.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px 10px">
        <a href="https://matrizaprova.com" style="text-decoration:none">
          <img src="https://matrizaprova.com/logo.png" width="340" height="64" alt="Matriz Aprovação"
               style="display:block;border:0;outline:none;text-decoration:none;width:340px;max-width:340px;height:auto">
        </a>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:16px 16px 40px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px">

          <!-- HERO -->
          <tr>
            <td style="background-color:#0E1117;border-radius:16px;padding:40px 36px;text-align:left">
              <p style="margin:0 0 14px;color:#C8FF3D;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:3px">conta criada com sucesso</p>
              <h1 style="margin:0 0 16px;color:#FFFFFF;font-size:27px;font-weight:700;line-height:1.25">
                Bem-vindo, ${nomeEsc}!
              </h1>
              <p style="margin:0 0 26px;color:rgba(255,255,255,0.68);font-size:15px;line-height:1.7">
                Sua conta está pronta e você já está no modo <strong style="color:#FFFFFF">${areaEsc}</strong>.
                A IA já está mapeando o padrão da sua banca para montar o estudo cirúrgico da sua aprovação.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px">
                    <a href="https://matrizaprova.com/dashboard"
                       style="display:inline-block;background-color:#C8FF3D;color:#0E1117;font-weight:700;font-size:14px;padding:15px 30px;border-radius:10px;text-decoration:none">
                      Acessar o app →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:rgba(255,255,255,0.32);font-size:11px;line-height:1.5">
                Se você não criou esta conta, ignore este email com segurança.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 0 0;text-align:left">
              <p style="margin:0 0 12px;color:#6B7280;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:2px">o que te espera no app</p>
            </td>
          </tr>

          <!-- BENEFITS 2x2 -->
          <tr>
            <td style="padding:0">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="50%" style="vertical-align:top;padding-right:6px">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background-color:#FFFFFF;border:1px solid #E4DFD2;border-radius:12px;padding:18px 16px">
                          <p style="margin:0 0 6px;color:#0E1117;font-size:14px;font-weight:700">Banco de questões</p>
                          <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.55">Milhares de questões comentadas, filtráveis por banca, ano e assunto.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="vertical-align:top;padding-left:6px">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background-color:#FFFFFF;border:1px solid #E4DFD2;border-radius:12px;padding:18px 16px">
                          <p style="margin:0 0 6px;color:#0E1117;font-size:14px;font-weight:700">PDFs cirúrgicos</p>
                          <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.55">Materiais enxutos de 10 a 30 páginas. Só o que realmente cai na sua banca.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 6px 0 0;vertical-align:top">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background-color:#FFFFFF;border:1px solid #E4DFD2;border-radius:12px;padding:18px 16px">
                          <p style="margin:0 0 6px;color:#0E1117;font-size:14px;font-weight:700">IA preditiva</p>
                          <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.55">Prevê os tópicos com maior chance de cair e ajusta seu plano toda semana.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:12px 0 0 6px;vertical-align:top">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background-color:#FFFFFF;border:1px solid #E4DFD2;border-radius:12px;padding:18px 16px">
                          <p style="margin:0 0 6px;color:#0E1117;font-size:14px;font-weight:700">Simulados + ranking</p>
                          <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.55">No estilo da banca, com cronômetro real e ranking nacional.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PLANO NOTE -->
          <tr>
            <td style="padding:28px 0 0">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#C8FF3D;border-radius:12px;padding:20px 22px;text-align:left">
                    <p style="margin:0 0 6px;color:#0E1117;font-size:14px;font-weight:700">Está no plano demo — explore à vontade.</p>
                    <p style="margin:0;color:rgba(14,17,23,0.75);font-size:13px;line-height:1.6">
                      Questões, PDFs e simulados com limite diário no modo demo. Quando quiser liberar as 4 áreas com acesso vitalício, é um único pagamento.
                      <a href="https://matrizaprova.com/assinar" style="color:#0E1117;font-weight:700;text-decoration:underline">Ver o plano vitalício →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:32px 0 0;text-align:center">
              <p style="margin:0 0 4px;color:#6B7280;font-size:11px">Matriz Aprovação Tecnologia Educacional LTDA · CNPJ 54.892.317/0001-43</p>
              <p style="margin:0;color:#6B7280;font-size:11px">
                <a href="mailto:suporte@matrizaprova.com" style="color:#6B7280;text-decoration:none">suporte@matrizaprova.com</a>
                &nbsp;·&nbsp;
                <a href="https://matrizaprova.com" style="color:#6B7280;text-decoration:none">matrizaprova.com</a>
              </p>
              <p style="margin:14px 0 0;font-size:10px;color:#9CA3AF;line-height:1.6">
                Você recebeu este email porque criou uma conta em matrizaprova.com.<br>
                <a href="mailto:suporte@matrizaprova.com?subject=Descadastrar" style="color:#9CA3AF;text-decoration:underline">Cancelar inscrição</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
