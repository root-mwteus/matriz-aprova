import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Trocar para "noreply@matrizaprova.com" após verificar o domínio no Resend
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

function boasVindasText(nome: string, area: string) {
  return `Olá, ${nome}!

Sua conta na Matriz Aprovação está pronta. Você está no modo ${area}.

Acesse o app: https://matrizaprova.com/dashboard

Se você não criou esta conta, ignore este email.

---
Matriz Aprovação Tecnologia Educacional LTDA
suporte@matrizaprova.com
matrizaprova.com`
}

function boasVindasHtml(nome: string, area: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bem-vindo à Matriz Aprovação</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F1EA;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:28px;text-align:center">
              <span style="font-size:26px;font-weight:700;color:#0E1117;letter-spacing:-0.5px">matriz</span><span style="font-size:26px;font-weight:700;color:#9FD41C">.</span>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background-color:#0E1117;border-radius:16px;padding:40px 36px">
              <p style="margin:0 0 14px;color:#9FD41C;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:3px">conta criada com sucesso</p>
              <h1 style="margin:0 0 16px;color:#FFFFFF;font-size:26px;font-weight:700;line-height:1.2">
                Bem-vindo, ${nome}!
              </h1>
              <p style="margin:0 0 28px;color:rgba(255,255,255,0.65);font-size:15px;line-height:1.65">
                Sua conta está pronta. Você está no modo <strong style="color:#FFFFFF">${area}</strong> — a IA já está mapeando o que você precisa estudar para a sua aprovação.
              </p>
              <a href="https://matrizaprova.com/dashboard"
                 style="display:inline-block;background-color:#C8FF3D;color:#0E1117;font-weight:700;font-size:13px;padding:14px 28px;border-radius:8px;text-decoration:none">
                Acessar o app
              </a>
              <p style="margin:28px 0 0;color:rgba(255,255,255,0.3);font-size:11px;line-height:1.5">
                Se você não criou esta conta, ignore este email com segurança.
              </p>
            </td>
          </tr>

          <!-- Stats row -->
          <tr>
            <td style="padding-top:16px">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#0E1117;border-radius:12px;padding:20px 12px;text-align:center">
                    <p style="margin:0;color:#C8FF3D;font-size:22px;font-weight:700">4</p>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.45);font-size:10px;text-transform:uppercase;letter-spacing:1px">áreas</p>
                  </td>
                  <td style="width:10px"></td>
                  <td style="background-color:#0E1117;border-radius:12px;padding:20px 12px;text-align:center">
                    <p style="margin:0;color:#C8FF3D;font-size:22px;font-weight:700">10K+</p>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.45);font-size:10px;text-transform:uppercase;letter-spacing:1px">PDFs</p>
                  </td>
                  <td style="width:10px"></td>
                  <td style="background-color:#0E1117;border-radius:12px;padding:20px 12px;text-align:center">
                    <p style="margin:0;color:#C8FF3D;font-size:22px;font-weight:700">IA</p>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.45);font-size:10px;text-transform:uppercase;letter-spacing:1px">preditiva</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center">
              <p style="margin:0 0 4px;color:#999;font-size:11px">Matriz Aprovação Tecnologia Educacional LTDA</p>
              <p style="margin:0;color:#999;font-size:11px">
                <a href="mailto:suporte@matrizaprova.com" style="color:#999;text-decoration:none">suporte@matrizaprova.com</a>
                &nbsp;·&nbsp;
                <a href="https://matrizaprova.com" style="color:#999;text-decoration:none">matrizaprova.com</a>
              </p>
              <p style="margin:12px 0 0;font-size:10px;color:#bbb">
                Você recebeu este email porque criou uma conta em matrizaprova.com.
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
