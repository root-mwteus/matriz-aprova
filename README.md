# Matriz Aprova

Plataforma de estudos para concursos públicos, vestibulares e militares. 
Milhares de questões comentadas, simulados inteligentes, materiais em PDF e plano de estudos personalizado.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS + Framer Motion
- **Autenticação/Banco**: Supabase (Auth + PostgreSQL + Storage)
- **Fonte**: Space Grotesk

## Pré-requisitos

- Node.js 20+
- npm
- Conta no [Supabase](https://supabase.com) (grátis)
- Conta na [Vercel](https://vercel.com) (grátis)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/matriz-aprova.git
cd matriz-aprova

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, execute `supabase-schema.sql` para criar as tabelas
3. No SQL Editor, execute `supabase-seed.sql` para popular dados de exemplo
4. Vá em **Project Settings > API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
5. No Authentication > Settings, configure:
   - `Site URL`: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
6. (Opcional) Ative o provedor Google em Authentication > Providers
7. **Bancos já existentes**: rode também as migrations em `supabase/` na
   ordem (`supabase-migration-001` … `supabase-migration-012`), pulando as
   que já foram aplicadas — o `supabase-schema.sql` é o estado final
   consolidado e serve apenas para setups novos.

## Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Inicia servidor de produção |
| `npm run lint` | Verifica lint |

## Estrutura do Projeto

```
src/
├── app/
│   ├── (dashboard)/   # Rotas protegidas (autenticadas)
│   │   ├── dashboard/ # Home do aluno
│   │   ├── questoes/  # Banco de questões
│   │   ├── simulados/ # Simulados e ranking
│   │   ├── materiais/ # Materiais de estudo
│   │   ├── plano/     # Plano de estudos
│   │   ├── editais/   # Editais
│   │   └── estatisticas/ # Estatísticas
│   ├── admin/         # Painel administrativo
│   ├── login/         # Login
│   ├── cadastro/      # Cadastro
│   ├── onboarding/    # Pós-cadastro
│   └── api/           # API Routes
├── components/        # Componentes reutilizáveis
├── contexts/          # Context providers
├── lib/               # Utilitários e configurações
│   └── supabase/      # Clients Supabase
├── types/             # Tipos TypeScript
└── middleware.ts      # Proteção de rotas
```

## Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Adicione as variáveis de ambiente no dashboard da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (URL do seu deploy)
   - `OPENAI_API_KEY` (plano de estudos por IA)
   - `RESEND_API_KEY` (e-mails de boas-vindas e recuperação de senha)
4. No Supabase, atualize:
   - **Authentication > Settings > Site URL**: URL da Vercel
   - **Authentication > Settings > Redirect URLs**: `https://seu-site.vercel.app/auth/callback`
5. Deploy automático a cada push na branch `main`

## Design System

- **Background**: `#0D0D0D` com textura grid de pontos
- **Acento**: `#CBFF4D` (verde-limão)
- **Cards**: `#1A1A1A` com borda `#2A2A2A`, radius 12px
- **Texto**: `#FFFFFF` (primário) / `#888888` (secundário)
- **Tipografia**: Space Grotesk, títulos uppercase com letter-spacing

## Licença

Projeto privado — todos os direitos reservados.
