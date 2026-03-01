# AABB Tênis — Sistema de Reservas e Torneios

Sistema MVP completo para reservas de quadras e gerenciamento de torneios de tênis.

## Stack
- **Next.js 16.1** (App Router, Server Components, Turbopack padrão)
- **React 19.2**
- **TypeScript 5.7**
- **Tailwind CSS 3.4**
- **Supabase** (PostgreSQL + Auth + RLS)
- **Node.js 20.9+** (requisito do Next.js 16)
- **Fontes:** Bebas Neue + DM Sans
- **Cores:** Azul `#0038A9` · Amarelo `#F9DD17`

---

## Setup Rápido

### 1. Pré-requisitos
```bash
node --version  # deve ser >= 20.9.0
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Variáveis de ambiente
Crie `.env.local` com suas credenciais do Supabase (já configuradas):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Banco de dados
No **SQL Editor** do Supabase, execute:
```
supabase/schema.sql
```

### 5. Rodar em desenvolvimento
```bash
npm run dev
```
Acesse: **http://localhost:3000**

> O Turbopack é o bundler padrão no Next.js 16. Com `turbopackFileSystemCacheForDev: true`
> o servidor reinicia ~10x mais rápido após a primeira compilação.

---

## Mudanças do Next.js 14 → 16

### 🔄 `middleware.ts` → `proxy.ts`
O arquivo de middleware foi renomeado para `proxy.ts` e a função exportada
passou de `middleware` para `proxy`. A principal diferença é que `proxy.ts`
roda **somente no Node.js runtime** (não suporta Edge runtime).

```ts
// ANTES (Next.js 14/15)  src/middleware.ts
export async function middleware(request: NextRequest) { ... }

// AGORA (Next.js 16)  src/proxy.ts
export async function proxy(request: NextRequest) { ... }
```

### 🔄 `cookies()` agora é síncrono
Em Next.js 16, `cookies()` do `next/headers` é síncrono — não é mais necessário usar `await`.

```ts
// ANTES
const cookieStore = await cookies();

// AGORA
const cookieStore = cookies();
```

### 🔄 `themeColor` movido para `Viewport`
```ts
// ANTES
export const metadata: Metadata = { themeColor: "#0038A9" };

// AGORA
export const viewport: Viewport = { themeColor: "#0038A9" };
```

### ✅ Turbopack é padrão
Não é mais necessário rodar `next dev --turbopack`. O Turbopack é o bundler
padrão para todos os projetos novos.

### ✅ React Compiler estável (opt-in)
O React Compiler está estável mas não habilitado por padrão. Para habilitar:
```ts
// next.config.ts
experimental: { reactCompiler: true }
```

### ✅ `serverActions` removido de experimental
Server Actions são estáveis desde Next.js 15 — a flag `experimental.serverActions`
foi removida e não é mais necessária.

---

## Funcionalidades

### 🔐 Autenticação
- Login e cadastro com e-mail/senha via Supabase Auth
- `proxy.ts` protege todas as rotas automaticamente
- Perfil de associado criado automaticamente no cadastro

### 📅 Reservas (`/reservas`)
- Grade visual de horários (07h–21h × todas as quadras)
- Seletor de 7 dias com navegação
- Verificação de conflito de horários em tempo real
- Limite de 2 reservas/semana por associado
- Cancelamento com 1 clique

### 🏠 Dashboard (`/dashboard`)
- Status ao vivo de todas as quadras
- Stats: quadras livres, minhas reservas, torneios ativos, associados
- Próximas reservas do usuário

### 🏆 Torneios (`/torneios`)
- Criar torneios com modalidade, formato e vagas
- Inscrição com controle de vagas
- Visualização de chave eliminatória (bracket)

---

## Estrutura

```
src/
├── proxy.ts                    # ← Next.js 16 (era middleware.ts)
├── app/
│   ├── layout.tsx              # Viewport export para themeColor
│   ├── globals.css
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── auth/callback/route.ts
│   └── (app)/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── reservas/page.tsx
│       └── torneios/page.tsx
├── components/
│   ├── Header.tsx
│   ├── ToastProvider.tsx
│   ├── BookingModal.tsx
│   ├── DashboardClient.tsx
│   ├── ReservasClient.tsx
│   └── TorneiosClient.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server client (cookies() síncrono)
│   └── utils.ts
└── types/index.ts
```

---

## Build para Produção
```bash
npm run build
npm start
```

## Upgrade Automático (futuras versões)
```bash
npx next upgrade
```
