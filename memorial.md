# Memorial Técnico - Loja Atibaia

**Data de Criação:** 25 de maio de 2026  
**Versão do Projeto:** 0.1.0  
**Ambiente de Execução:** Node.js + Next.js 16.2.4 + React 19.2.4  
**Status:** Desenvolvimento Ativo

---

## 1. Visão Geral do Projeto

**Loja Atibaia** é uma aplicação web de gerenciamento de membros de uma loja maçônica, construída com Next.js 16.2.4. O projeto fornece uma plataforma para:

- Gestão de membros (cadastro, atualização, listagem, inativação)
- Controle de presença em sessões
- Registro de frases e pensamentos
- Gestão de aniversários
- Relatórios de histórico e presença
- Autenticação segura com JWT
- Integração com banco de dados PostgreSQL (Neon)

### Objetivos Principais
- Centralizar informações de membros em um único sistema
- Monitorar frequência e participação em sessões
- Registrar e acessar frases inspiradoras
- Gerar relatórios para análise de dados
- Disponibilizar informações aos membros (aniversários, etc)

---

## 2. Stack Tecnológico

### Frontend
- **Framework:** Next.js 16.2.4 (App Router - versão com breaking changes)
- **UI Library:** React 19.2.4
- **Styling:** TailwindCSS 4 + PostCSS
- **UI Components:** Shadcn/UI (via components.json)
- **Formulários:** React Hook Form 7.72.1 + Zod 4.3.6
- **Gráficos:** Recharts 3.8.1
- **Notificações:** Sonner 2.0.7
- **Ícones:** Lucide React 1.8.0
- **Themes:** Next Themes 0.4.6
- **Query Client:** TanStack React Query 5.99.0

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **ORM:** Prisma 7.7.0
- **Database Adapter:** Neon (Serverless PostgreSQL)
- **Autenticação:** NextAuth.js 5.0.0-beta.31
- **Criptografia:** bcryptjs 3.0.3
- **Validação:** Zod 4.3.6

### Database
- **Provider:** PostgreSQL (Neon - Serverless)
- **Adapter:** @prisma/adapter-neon 7.7.0
- **Connection Pooling:** Vercel PgBouncer
- **Generated Client Location:** `src/generated/prisma`

### DevOps & Ferramentas
- **Deployments:** Vercel
- **Storage:** Vercel Blob (para fotos)
- **Analytics:** Vercel Analytics
- **Linting:** ESLint 9 + ESLint Config Next
- **TypeScript:** 5+
- **Build Bundler:** Next.js (Webpack)
- **Type Generator:** tsx 4.21.0

### Bibliotecas Utilitárias
- **Date Manipulation:** date-fns 4.1.0
- **CSS Utilities:** clsx 2.1.1, tailwind-merge 3.5.0
- **Form Resolution:** @hookform/resolvers 5.2.2
- **Utilities:** @base-ui/react 1.4.0
- **WebSocket:** ws 8.20.0

---

## 3. Arquitetura & Estrutura do Projeto

### 3.1 Estrutura de Diretórios

```
loja-atibaia/
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Rotas protegidas do dashboard
│   │   │   ├── aniversarios/      # Visualização de aniversários
│   │   │   ├── frases/            # Gestão de frases
│   │   │   ├── membros/           # CRUD de membros
│   │   │   ├── relatorios/        # Relatórios (histórico e presença)
│   │   │   ├── sessoes/           # Gestão de sessões
│   │   │   ├── layout.tsx         # Layout com auth check
│   │   │   └── page.tsx           # Dashboard home
│   │   ├── api/                   # API Routes
│   │   │   ├── aniversarios/      # Endpoints de aniversários
│   │   │   ├── auth/[...nextauth] # Configuração NextAuth
│   │   │   ├── cep/               # Integração com API CEP
│   │   │   ├── frases/            # CRUD de frases
│   │   │   ├── membros/           # CRUD de membros + import
│   │   │   ├── relatorios/        # Endpoints de relatórios
│   │   │   └── sessoes/           # CRUD de sessões
│   │   ├── login/                 # Página de login
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Estilos globais
│   ├── components/
│   │   ├── dashboard/             # Componentes de dashboard
│   │   ├── layout/                # Componentes de layout
│   │   ├── membros/               # Componentes de formulário e tabela
│   │   ├── relatorios/            # Componentes de relatórios
│   │   ├── sessoes/               # Componentes de sessões
│   │   ├── ui/                    # Componentes Shadcn/UI
│   │   └── providers.tsx          # Provedores (Query, Auth, Theme)
│   ├── generated/
│   │   └── prisma/                # Prisma client gerado
│   ├── lib/
│   │   ├── auth.ts                # Configuração NextAuth
│   │   ├── prisma.ts              # Instância Prisma singleton
│   │   ├── utils.ts               # Utilities gerais
│   │   ├── utils/
│   │   │   ├── csv.ts             # Funcionalidades CSV
│   │   │   ├── format.ts          # Formatação de dados
│   │   │   └── presence.ts        # Cálculos de presença
│   │   └── validations/           # Schemas Zod
│   │       ├── member.ts
│   │       └── session.ts
│   ├── proxy.ts                   # Proxy configuration
│   └── app/globals.css            # TailwindCSS global
├── prisma/
│   ├── schema.prisma              # Modelo de dados
│   ├── seed.ts                    # Script de seed inicial
│   ├── seed-frases.ts             # Script de seed de frases
│   └── migrations/                # Histórico de migrações
├── public/                        # Arquivos estáticos
├── .env                           # Variáveis de ambiente
├── next.config.ts                 # Configuração Next.js
├── tsconfig.json                  # Configuração TypeScript
├── postcss.config.mjs             # Configuração PostCSS
├── tailwind.config.ts             # Configuração TailwindCSS
├── eslint.config.mjs              # Configuração ESLint
├── components.json                # Configuração Shadcn
├── vercel.json                    # Configuração Vercel
├── package.json                   # Dependências do projeto
└── migrate-data.ts                # Script de migração de dados

```

### 3.2 Arquitetura de Camadas

```
┌─────────────────────────────────────┐
│      Camada de Apresentação         │
│  (Pages, Components, UI Layer)      │
├─────────────────────────────────────┤
│      Camada de Negócio              │
│  (Server Actions, API Routes)       │
├─────────────────────────────────────┤
│      Camada de Dados                │
│  (Prisma ORM, Database Adapters)    │
├─────────────────────────────────────┤
│      Camada de Persistência         │
│  (PostgreSQL Neon, Vercel Blob)     │
└─────────────────────────────────────┘
```

---

## 4. Modelo de Dados (Prisma Schema)

### 4.1 Entidades Principais

#### **User (Autenticação)**
```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String?  # Hash bcrypt
  role      UserRole @default(ADMIN)  # ADMIN | VIEWER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **Member (Membros da Loja)**
```prisma
model Member {
  id                String         @id @default(cuid())
  cim               String         @unique          # ID único (Cadastro CIM)
  situacao          MemberSituacao @default(ATIVO)  # ATIVO | INATIVO
  nome              String
  dataNascimento    DateTime?
  posicao           Posicao                         # MI, CM, MM, AM
  
  # Datas de marcos importantes
  dataIniciacao     DateTime?
  dataElevacao      DateTime?
  dataExaltacao     DateTime?
  dataInstalacao    DateTime?
  dataRegulFiliacao DateTime?
  
  # Dados de endereço
  rua, numero, complemento, bairro, cep, cidade: String?
  
  # Contato
  telefone, email: String?
  isWhatsapp       Boolean @default(false)
  
  # Profissional
  ocupacao, notasOcupacao: String?
  
  # Familiar
  conjuge, nascimentoConjuge: String?
  dataCasamento: String?
  
  # Relações
  filhos    Filho[]
  presencas Presenca[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([situacao, posicao])
}

enum Posicao {
  MI  # Membro Iniciado
  CM  # Companheiro Maçom
  MM  # Mestre Maçom
  AM  # Aprendiz Maçom
}

enum MemberSituacao {
  ATIVO
  INATIVO
}
```

#### **Filho (Dependentes)**
```prisma
model Filho {
  id             String    @id @default(cuid())
  memberId       String
  nome           String
  dataNascimento DateTime?
  member         Member    @relation(fields: [memberId], references: [id], onDelete: Cascade)
}
```

#### **Frase (Pensamentos/Frases Inspiradoras)**
```prisma
model Frase {
  id             String    @id @default(cuid())
  texto          String    @db.Text
  autor          String
  descricaoAutor String?   @db.Text
  tema           String
  ativo          Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

#### **LojaSession (Sessões/Reuniões)**
```prisma
model LojaSession {
  id        String      @id @default(cuid())
  data      DateTime
  descricao String?
  tipo      SessionTipo @default(ORDINARIA)  # ORDINARIA | MAGNA | ESPECIAL
  fotoUrl   String?
  fotoKey   String?
  presencas Presenca[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([data])
}

enum SessionTipo {
  ORDINARIA
  MAGNA
  ESPECIAL
}
```

#### **Presenca (Registro de Frequência)**
```prisma
model Presenca {
  id         String         @id @default(cuid())
  memberId   String
  sessionId  String
  status     PresencaStatus @default(F)  # P, F, T, J
  observacao String?
  
  member     Member         @relation(fields: [memberId], references: [id], onDelete: Cascade)
  session    LojaSession    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
  
  @@unique([memberId, sessionId])
  @@index([memberId, sessionId])
}

enum PresencaStatus {
  P  # Presente
  F  # Falta
  T  # Trabalhando
  J  # Justificada
}
```

### 4.2 Relações de Dados

```
User (1) ------ (*) ? (sem relação direta com outros)

Member (1) ------ (*) Filho (onDelete: Cascade)
Member (1) ------ (*) Presenca (onDelete: Cascade)

LojaSession (1) ------ (*) Presenca (onDelete: Cascade)

Frase (standalone)
```

---

## 5. Autenticação e Segurança

### 5.1 Sistema de Autenticação

**Provider:** NextAuth.js 5.0.0-beta.31 + Credentials Provider

**Fluxo:**
1. Usuário acessa `/login`
2. Valida email e senha com Zod schema
3. Busca usuário no banco de dados
4. Compara hash da senha com bcryptjs
5. Gera JWT com estratégia de sessão: "jwt"
6. Armazena role (ADMIN/VIEWER) no token
7. Valida em cada requisição do dashboard

**Arquivo Principal:** [src/lib/auth.ts](src/lib/auth.ts)

```typescript
// Estratégia: JWT
session: { strategy: "jwt" }

// Callbacks
callbacks: {
  jwt({ token, user }) {
    if (user) token.role = user.role
    return token
  },
  session({ session, token }) {
    if (session.user) session.user.role = token.role
    return session
  },
}
```

### 5.2 Proteção de Rotas

**Dashboard Layout** (Linha 11 em [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx)):
```typescript
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  // ... render dashboard
}
```

### 5.3 Criptografia de Senha

- **Algoritmo:** bcryptjs
- **Rounds:** Padrão (10+)
- **Aplicação:** Implementada em [src/lib/auth.ts](src/lib/auth.ts)

### 5.4 Roles & Autorização

**Dois níveis de acesso:**
- **ADMIN:** Acesso completo ao sistema
- **VIEWER:** Acesso somente leitura (implementar conforme necessário)

---

## 6. Funcionalidades Principais

### 6.1 Gestão de Membros
- **CRUD Completo:** Criar, ler, atualizar, deletar membros
- **Importação:** Suporte a importação em batch (endpoint: `/api/membros/import`)
- **Busca:** Filtros por CIM, nome, posição, situação
- **Campos Estendidos:** Informações pessoais, profissionais, familiares
- **Validação:** Schema Zod em [src/lib/validations/member.ts](src/lib/validations/member.ts)
- **UI:** Form e tabela em [src/components/membros/](src/components/membros/)

**Endpoints API:**
- `GET/POST /api/membros` - Listar/criar membros
- `GET/PUT/DELETE /api/membros/[id]` - Operações individuais
- `POST /api/membros/import` - Importação em batch

### 6.2 Gestão de Sessões/Reuniões
- **CRUD:** Criar, listar, atualizar sessões
- **Tipos:** Ordinária, Magna, Especial
- **Documentação:** Descrição e fotos (Vercel Blob)
- **Presença:** Marcar presença dos membros
- **Validação:** Schema em [src/lib/validations/session.ts](src/lib/validations/session.ts)

**Endpoints API:**
- `GET/POST /api/sessoes` - Listar/criar sessões
- `GET/PUT/DELETE /api/sessoes/[id]` - Operações individuais

### 6.3 Controle de Presença
- **Status:** P (Presente), F (Falta), T (Trabalhando), J (Justificada)
- **Registro:** Marcar presença por sessão
- **Histórico:** Acompanhar histórico completo
- **Relatórios:** Calcular percentuais e estatísticas

**Componentes:**
- [src/components/sessoes/attendance-table.tsx](src/components/sessoes/attendance-table.tsx)
- Utilitários: [src/lib/utils/presence.ts](src/lib/utils/presence.ts)

### 6.4 Gestão de Frases
- **CRUD:** Criar, listar, atualizar, desativar frases
- **Metadados:** Autor, descrição do autor, tema
- **Frase Aleatória:** Endpoint `/api/frases/random`
- **Seed:** Dados iniciais em [prisma/seed-frases.ts](prisma/seed-frases.ts)

**Endpoints API:**
- `GET/POST /api/frases` - Listar/criar frases
- `GET/DELETE /api/frases/[id]` - Operações individuais
- `GET /api/frases/random` - Frase aleatória

### 6.5 Relatórios
- **Presença:** Estatísticas de frequência por membro/período
- **Histórico:** Histórico completo de presença
- **Filtros:** Por período, membro, situação
- **Exportação:** Funcionalidade em desenvolvimento

**Componentes:**
- [src/components/relatorios/](src/components/relatorios/)
- Endpoints: `/api/relatorios/presenca`, `/api/relatorios/historico`

### 6.6 Aniversários
- **Listagem:** Membros por data de nascimento
- **Filtros:** Por mês, próximos aniversários
- **Notificações:** Integrado com dashboard

**Endpoints API:**
- `GET /api/aniversarios` - Listar aniversários

### 6.7 Integração CEP
- **Autocomplete:** Buscar endereço pelo CEP
- **Provider:** Integração com API externa de CEP
- **Endpoint:** `GET /api/cep?cep=xxxxx`

### 6.8 Visualizações & Gráficos
- **Pie Chart:** Distribuição de membros por posição (MemberPieChart)
- **Presence Calculator:** Cálculos de presença
- **Componentes:** [src/components/dashboard/](src/components/dashboard/)

---

## 7. API Routes & Endpoints

### 7.1 Estrutura de API

**Padrão:** RESTful + JSON  
**Base URL:** `http://localhost:3000/api` (dev)  
**Autenticação:** JWT via NextAuth  
**Validação:** Zod schemas

### 7.2 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/[...nextauth]` | Configuração NextAuth |
| GET/POST | `/membros` | CRUD de membros |
| POST | `/membros/import` | Importação em batch |
| GET/POST | `/sessoes` | CRUD de sessões |
| GET | `/frases` | Listar frases |
| POST | `/frases` | Criar frase |
| GET | `/frases/random` | Frase aleatória |
| GET | `/aniversarios` | Listar aniversários |
| GET | `/cep?cep=xxxxx` | Buscar endereço por CEP |
| GET | `/relatorios/presenca` | Relatório de presença |
| GET | `/relatorios/historico` | Histórico de presença |

---

## 8. Variáveis de Ambiente

**Arquivo:** `.env`

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"

# Authentication
AUTH_SECRET="loja-itapetininga-2025-auth-secret-k9x2p7m"
NEXTAUTH_URL="http://localhost:3000"

# Optional
VERCEL_URL="..."
NODE_ENV="development|production"
```

**Variáveis Críticas:**
- `DATABASE_URL` - Connection pooling (Vercel PgBouncer)
- `DATABASE_URL_UNPOOLED` - Migrações (sem pooling)
- `AUTH_SECRET` - Chave para assinar JWTs (≥32 caracteres)
- `NEXTAUTH_URL` - URL pública da aplicação

---

## 9. Configurações Importantes

### 9.1 Next.js Configuration ([next.config.ts](next.config.ts))

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
}
```

**Observações:**
- Limite de 10MB para Server Actions (upload de fotos)
- Integração com Vercel Blob para armazenamento remoto

### 9.2 TypeScript Configuration ([tsconfig.json](tsconfig.json))

- **Target:** ES2017
- **Module:** esnext
- **Strict Mode:** Ativado
- **Path Alias:** `@/*` → `./src/*`
- **JSX:** react-jsx

### 9.3 TailwindCSS Configuration

- **Versão:** 4.0
- **Modo:** Requer `@tailwindcss/postcss`
- **Integração:** Automática com Next.js

### 9.4 Prisma Configuration

**Output Location:** `src/generated/prisma`  
**Database Provider:** PostgreSQL  
**Driver Adapters:** Neon HTTP adapter  
**Preview Features:** `driverAdapters`

---

## 10. Scripts & Comandos

### 10.1 Desenvolvimento

```bash
npm run dev       # Inicia servidor de desenvolvimento (port 3000)
npm run build     # Build para produção
npm start         # Inicia servidor de produção
npm run lint      # Executa ESLint
```

### 10.2 Database

```bash
npm run db:push         # Push schema para banco (sem migrações)
npm run db:seed         # Execute seed script (seed.ts)
npm run db:studio       # Abre Prisma Studio (GUI)
```

### 10.3 Sequência Build

```bash
prisma generate  # Gera Prisma client → src/generated/prisma
next build       # Build Next.js
```

---

## 11. Dependências Críticas & Versões

### 11.1 Versões Fixas (Breaking Changes)

- **Next.js 16.2.4** - Versão com breaking changes, ler docs em `node_modules/next/dist/docs/`
- **NextAuth.js 5.0.0-beta.31** - Beta, API diferente de v4
- **Prisma 7.7.0** - Adapter pattern obrigatório para serverless
- **React 19.2.4** - Versão mais recente

### 11.2 Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| @prisma/client | 7.7.0 | ORM |
| @prisma/adapter-neon | 7.7.0 | Neon adapter |
| next-auth | 5.0.0-beta.31 | Autenticação |
| react-hook-form | 7.72.1 | Formulários |
| zod | 4.3.6 | Validação |
| shadcn | 4.3.0 | UI components |
| recharts | 3.8.1 | Gráficos |

---

## 12. Convenções de Código

### 12.1 Estrutura de Pastas

```
Regra: Agrupar por domínio/feature, não por tipo
✓ Correto:   /src/components/membros/
✗ Incorreto: /src/components/forms/
```

### 12.2 Nomenclatura

- **Componentes React:** PascalCase (`MemberForm.tsx`)
- **Utilitários/Funções:** camelCase (`formatDate.ts`)
- **Tipos/Interfaces:** PascalCase (`MemberData`, `SessionType`)
- **Arquivos API:** lowercase com hífens (`route.ts` dentro de pastas)

### 12.3 Validação

- Todos os formulários devem usar **Zod schemas**
- Schemas localizados em `src/lib/validations/`
- Validação dupla: frontend + backend

### 12.4 Tipagem

- TypeScript **strict mode** obrigatório
- Sem `any` sem comentário `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- Tipos explícitos em funções API

---

## 13. Padrões & Boas Práticas

### 13.1 Server Components vs Client Components

**Server Components (padrão):**
```typescript
// app/(dashboard)/membros/page.tsx
export default async function MembrosPage() {
  const members = await prisma.member.findMany()
  return <MemberTable data={members} />
}
```

**Client Components (interatividade):**
```typescript
'use client'
import { MemberForm } from '@/components/membros/member-form'
export default function NewMemberPage() {
  return <MemberForm />
}
```

### 13.2 Error Handling

**API Routes:**
```typescript
try {
  const data = await prisma.member.create({ data })
  return Response.json(data)
} catch (error) {
  return Response.json({ error: error.message }, { status: 400 })
}
```

### 13.3 Prisma Best Practices

**Singleton Pattern** ([src/lib/prisma.ts](src/lib/prisma.ts)):
```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

**Índices:** Usar para campos frequentemente filtrados
```prisma
@@index([situacao])
@@index([posicao])
@@unique([memberId, sessionId])
```

### 13.4 Formulários & Validação

**Padrão com React Hook Form + Zod:**
```typescript
const form = useForm<z.infer<typeof memberSchema>>({
  resolver: zodResolver(memberSchema),
  defaultValues: { nome: "", email: "" }
})

const onSubmit = async (data) => {
  const result = await fetch('/api/membros', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

---

## 14. Deployment

### 14.1 Plataforma: Vercel

**Configuração:** [vercel.json](vercel.json)

**Variáveis de Ambiente no Vercel:**
- `DATABASE_URL` - Connection pooling
- `DATABASE_URL_UNPOOLED` - Para migrações
- `AUTH_SECRET` - JWT secret (≥32 caracteres)
- `NEXTAUTH_URL` - URL da aplicação

**Build Command:**
```bash
npm run build
# Internamente: prisma generate && next build
```

### 14.2 Database Migrations

**Estratégia: Vercel + Neon**

1. Desenvolvimento local:
   ```bash
   npm run db:push  # Sincroniza schema
   ```

2. Produção (via Vercel):
   - Use `DATABASE_URL_UNPOOLED` para migrações
   - Prisma maneja automáticamente

### 14.3 Checklist de Deploy

- [ ] `DATABASE_URL_UNPOOLED` configurada no Vercel
- [ ] `AUTH_SECRET` alterado (nunca reutilizar em produção)
- [ ] `NEXTAUTH_URL` aponta para domínio correto
- [ ] Variáveis de ambiente sincronizadas
- [ ] Build sem erros: `npm run build`
- [ ] Testes locais em modo produção: `npm run build && npm start`

---

## 15. Troubleshooting & Issues Conhecidos

### 15.1 Breaking Changes Next.js 16

**Aviso:** Leia `AGENTS.md` antes de escrever código novo

Potenciais mudanças:
- API Routes
- Middleware
- Revalidação de cache
- Streaming

**Solução:** Verificar docs em `node_modules/next/dist/docs/`

### 15.2 Prisma + Neon

**Problema:** "Cannot use unpooled connection"  
**Solução:** Usar `DATABASE_URL_UNPOOLED` para `db push` e migrações

**Problema:** "PrismaClient não inicializado"  
**Solução:** Verificar singleton pattern em [src/lib/prisma.ts](src/lib/prisma.ts)

### 15.3 NextAuth.js 5 Beta

**Breaking Changes v4 → v5:**
- `session.strategy = "jwt"` (não mais `database`)
- Callbacks estruturados diferentemente
- Imports de `next-auth/providers/credentials`

### 15.4 CORS & CSP

**Vercel Blob URLs:** Já configuradas em `next.config.ts`  
**APIs Externas:** Adicionar em `remotePatterns` conforme necessário

---

## 16. Performance & Otimizações

### 16.1 Query Optimization

- Usar `.select()` para limitar campos
- Implementar paginação para grandes datasets
- Usar índices em Prisma (implementados)

```typescript
// ✓ Bom
const members = await prisma.member.findMany({
  where: { situacao: "ATIVO" },
  select: { id: true, nome: true, posicao: true },
  take: 20
})
```

### 16.2 Caching

- TanStack React Query para client-side caching
- Next.js caching automático para Server Components
- Revalidação implementada via `revalidatePath()`

### 16.3 Imagens

- Vercel Blob para armazenamento
- Next Image component para otimização automática
- Remote patterns configuradas

---

## 17. Próximos Passos & Melhorias

### 17.1 A Implementar

- [ ] Filtros avançados em relatórios
- [ ] Exportação para PDF/Excel
- [ ] Notificações por email
- [ ] Autenticação multi-factor (MFA)
- [ ] Logs de auditoria
- [ ] Dashboard com mais métricas

### 17.2 Possíveis Refatorações

- [ ] Separar lógica de negócio em services
- [ ] Implementar padrão Repository
- [ ] Adicionar testes unitários (Jest)
- [ ] Adicionar testes E2E (Playwright)
- [ ] Implementar rate limiting

---

## 18. Referências & Documentação

### 18.1 Documentação Oficial

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [TailwindCSS](https://tailwindcss.com)

### 18.2 Arquivos Principais do Projeto

- [Prisma Schema](prisma/schema.prisma)
- [Next Config](next.config.ts)
- [Auth Config](src/lib/auth.ts)
- [Database Client](src/lib/prisma.ts)
- [Package Config](package.json)

### 18.3 Contato & Manutenção

**Desenvolvedor Senior:** [Seu Nome/Equipe]  
**Data da Análise:** 25 de maio de 2026  
**Versão do Memorial:** 1.0

---

## 19. Apêndice: Estrutura de Diretórios Completa

```
loja-atibaia/
├── .env                           # Variáveis de ambiente
├── .env.local                     # Variáveis locais (git ignored)
├── .eslintrc.json                 # ESLint config
├── .gitignore
├── AGENTS.md                      # Aviso: Breaking changes Next.js 16
├── CLAUDE.md                      # Referencia AGENTS.md
├── components.json                # Shadcn config
├── eslint.config.mjs              # ESLint novo sistema
├── migrate-data.ts                # Script de migração
├── memorial.md                    # Este documento
├── next-env.d.ts                  # Auto-generated Next types
├── next.config.ts                 # Config Next.js
├── package.json                   # Dependências
├── package-lock.json              # Lock file
├── postcss.config.mjs             # PostCSS config
├── prisma.config.ts               # Prisma config
├── README.md                      # README original
├── tailwind.config.ts             # TailwindCSS config
├── tsconfig.json                  # TypeScript config
├── vercel.json                    # Vercel config
│
├── prisma/
│   ├── schema.prisma              # Modelo de dados
│   ├── seed.ts                    # Script de seed
│   ├── seed-frases.ts             # Seed de frases
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20260430140524_init/
│       ├── 20260430150244_add_frases/
│       └── 20260430151757_add_frase_descricao_autor/
│
├── public/                        # Arquivos estáticos
│   └── ...
│
└── src/
    ├── app/
    │   ├── (dashboard)/           # Rotas protegidas
    │   │   ├── aniversarios/
    │   │   │   └── page.tsx
    │   │   ├── error.tsx
    │   │   ├── frases/
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── membros/
    │   │   │   ├── page.tsx
    │   │   │   ├── [id]/
    │   │   │   └── novo/
    │   │   ├── page.tsx
    │   │   ├── relatorios/
    │   │   │   ├── historico/
    │   │   │   └── presenca/
    │   │   └── sessoes/
    │   │       ├── page.tsx
    │   │       ├── [id]/
    │   │       └── nova/
    │   ├── api/
    │   │   ├── aniversarios/
    │   │   │   └── route.ts
    │   │   ├── auth/
    │   │   │   └── [...nextauth]/
    │   │   │       └── route.ts
    │   │   ├── cep/
    │   │   │   └── route.ts
    │   │   ├── frases/
    │   │   │   ├── route.ts
    │   │   │   ├── [id]/
    │   │   │   └── random/
    │   │   │       └── route.ts
    │   │   ├── membros/
    │   │   │   ├── route.ts
    │   │   │   ├── [id]/
    │   │   │   └── import/
    │   │   │       └── route.ts
    │   │   ├── relatorios/
    │   │   │   ├── historico/
    │   │   │   │   └── route.ts
    │   │   │   └── presenca/
    │   │   │       └── route.ts
    │   │   └── sessoes/
    │   │       └── ...
    │   ├── login/
    │   │   └── page.tsx
    │   ├── globals.css
    │   └── layout.tsx
    │
    ├── components/
    │   ├── dashboard/
    │   │   ├── MemberPieChart.tsx
    │   │   └── PresenceCalculator.tsx
    │   ├── layout/
    │   │   ├── footer.tsx
    │   │   ├── header.tsx
    │   │   ├── mobile-nav.tsx
    │   │   ├── navigation-loader.tsx
    │   │   └── sidebar.tsx
    │   ├── membros/
    │   │   ├── member-form.tsx
    │   │   └── member-table.tsx
    │   ├── relatorios/
    │   │   └── ...
    │   ├── sessoes/
    │   │   └── attendance-table.tsx
    │   ├── ui/
    │   │   ├── alert-dialog.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── dialog.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── popover.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── sheet.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── sonner.tsx
    │   │   ├── switch.tsx
    │   │   ├── tabs.tsx
    │   │   └── textarea.tsx
    │   └── providers.tsx
    │
    ├── generated/
    │   └── prisma/               # Gerado por Prisma
    │       ├── client.d.ts
    │       ├── client.js
    │       ├── index.d.ts
    │       ├── package.json
    │       └── ...
    │
    ├── lib/
    │   ├── auth.ts               # NextAuth config
    │   ├── prisma.ts             # Prisma singleton
    │   ├── utils.ts              # Utilitários gerais
    │   ├── utils/
    │   │   ├── csv.ts            # Funcionalidades CSV
    │   │   ├── format.ts         # Formatação
    │   │   └── presence.ts       # Cálculos de presença
    │   └── validations/
    │       ├── member.ts         # Zod schema
    │       └── session.ts        # Zod schema
    │
    └── proxy.ts                  # Proxy configuration
```

---

**Fim do Memorial Técnico**  
**Data:** 25 de maio de 2026  
**Versão:** 1.0  
**Status:** Completo
