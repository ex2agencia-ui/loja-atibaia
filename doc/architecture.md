# Arquitetura do Sistema

## Stack

| Camada | Tecnologia | Versão | Motivo |
|--------|-----------|--------|--------|
| Framework | Next.js | 16.2.4 | Full-stack React com App Router |
| Runtime | React | 19.2.4 | — |
| Banco de dados | PostgreSQL (Neon) | serverless | Sem custo de idle, escala automática |
| ORM | Prisma | 7.8.0 | Type-safety, migrations gerenciadas |
| Adapter DB | @prisma/adapter-neon | 7.7.0 | HTTP mode para serverless |
| Auth | NextAuth v5 beta | 5.0.0-beta.31 | JWT + Credentials provider |
| Validação | Zod | 4.x | Schema-first, integra com RHF |
| Forms | React Hook Form | 7.x | Performance, integração Zod |
| Server state | TanStack Query | 5.x | Cache, refetch, infinite scroll |
| Storage | Vercel Blob | 2.x | Imagens de posts e sessões |
| UI base | @base-ui/react | 1.4 | Componentes unstyled acessíveis |
| Estilos | Tailwind CSS | 4.x | Utility-first, tokens oklch |
| Ícones | lucide-react | 1.x | — |
| Gráficos | Recharts | 3.x | Dashboard analytics |
| Notificações | Sonner | 2.x | Toast system |
| Analytics | Vercel Analytics | 2.x | Page views |

## Estrutura de Pastas

```
src/
  app/
    (dashboard)/          # Rotas autenticadas (layout com sidebar)
      page.tsx            # Dashboard / redirect MEMBRO → /feed
      feed/               # Mural social
      membros/            # Gestão de irmãos
      sessoes/            # Reuniões e presença
      comunicados/        # Sistema de comunicados
      classificados/      # Diretório profissional
      usuarios/           # Gestão de usuários (admin)
      perfil/             # Perfil do usuário logado
      relatorios/         # Relatórios de presença
      aniversarios/       # Aniversariantes do mês
      frases/             # Frases maçônicas
      financeiro/         # Módulo financeiro (mensalidades, caixa)
      admin/
        config/           # Configurações da Loja (ADMIN only)
    api/                  # API Routes (Next.js)
      admin/
        config/           # GET/PUT/POST — ConfigLoja com SMTP criptografado
      financeiro/
        config/           # GET — subset financeiro da config
        mensalidades/     # CRUD de mensalidades + gerar-lote
    login/                # Tela de login
    trocar-senha/         # Troca de senha obrigatória
  components/
    ui/                   # Primitivos de UI (Button, Card, Dialog…)
    layout/               # Header, Sidebar, Footer, MobileNav
    feed/                 # PostComposer, PostCard, ReacoesBar, ImageUploader
    membros/              # MemberTable, MemberForm, AcessoSistemaCard
    sessoes/              # AttendanceTable
    classificados/        # NovoClassificadoDialog
    dashboard/            # MemberPieChart, PresenceCalculator
  lib/
    auth.ts               # NextAuth config (JWT callbacks, session callbacks)
    prisma.ts             # Prisma client singleton (Neon HTTP adapter)
    permissions.ts        # RBAC: can(), requireRole(), matrizes de acesso
    crypto.ts             # AES-256-GCM encrypt/decrypt (senha SMTP)
    utils.ts              # cn() helper (clsx + tailwind-merge)
    utils/
      format.ts           # formatarTelefone, formatarData, parseDataBR
      presence.ts         # calcularSituacaoPresenca, formatarPorcentagem
      csv.ts              # exportCSV, parseCSV
  validations/
    member.ts             # Zod schema do formulário de membro
    session.ts            # Zod schema de sessão e presença
prisma/
  schema.prisma           # Schema do banco
  migrations/             # Histórico de migrations
doc/                      # Esta pasta — documentação do projeto
```

## Decisões Técnicas Importantes

### Neon HTTP Mode — Sem Transações Implícitas

O adapter `@prisma/adapter-neon` usa HTTP (não WebSocket) no modo serverless.
**Restrição crítica**: qualquer operação que acione uma transação implícita falha.

Operações que disparam transações implícitas (PROIBIDAS):
- `prisma.model.create({ data: { nested: { create: [...] } } })`
- `prisma.model.createMany({ ..., skipDuplicates: true })`
- `prisma.model.upsert()` com nested writes

**Padrão correto:**
```typescript
// 1. Create simples, sem include
const record = await prisma.model.create({ data: { ...campos } })

// 2. Busca separada com include
const result = await prisma.model.findUnique({ where: { id: record.id }, include: { ... } })

// 3. Para múltiplos inserts: parallel individual creates
await Promise.all(
  items.map(item =>
    prisma.model.create({ data: item }).catch(() => null) // ignora duplicatas
  )
)
```

### Proxy em vez de Middleware

Esta versão do Next.js usa `proxy.ts` (não `middleware.ts`). Proteção de rotas é feita via `auth()` dentro de cada rota/page.

### JWT com Refresh Forçado

O JWT callback re-lê o banco quando `trigger === "update"` ou `!token.role`. Para forçar atualização da sessão (ex: após trocar senha):
```typescript
await update({}) // dispara trigger="update" no JWT callback
```

### Criptografia de Senhas — AES-256-GCM

`src/lib/crypto.ts` expõe duas funções: `encrypt(text)` e `decrypt(ciphertext)`.

- Algoritmo: AES-256-GCM com IV aleatório de 12 bytes
- Chave: variável de ambiente `ENCRYPTION_KEY` (32 bytes hex no `.env`, nunca exposta ao cliente)
- Formato armazenado: `iv_hex:authTag_hex:ciphertext_hex`
- Usada exclusivamente para `smtpPassEncrypted` na `ConfigLoja`
- A API `GET /api/admin/config` **nunca retorna** o campo cifrado; retorna apenas `smtpPassConfigured: boolean`

### Padrão MensalidadeLog — Audit Trail

Toda alteração em uma `Mensalidade` deve gravar um `MensalidadeLog`:

```typescript
await prisma.mensalidadeLog.create({
  data: {
    mensalidadeId: id,
    campo: "status",           // campo alterado
    valorAntes: "PENDENTE",    // valor anterior (serializado como string)
    valorDepois: "PAGO",       // novo valor
    motivo: "Baixa manual",    // justificativa opcional
    userId: session.user.id,   // quem realizou
  }
})
```

Este padrão garante rastreabilidade completa de baixas, acordos, isenções e reaberturas.

### Padrão Action-Based PUT — Mensalidades

O endpoint `PUT /api/financeiro/mensalidades/[id]` usa um campo `acao` para distinguir operações:

| `acao` | O que faz |
|--------|-----------|
| `"baixa"` | Registra pagamento: atualiza `status → PAGO`, grava `pagamento`, `valorTotal` |
| `"acordo"` | Registra parcelamento/acordo: atualiza valor e data |
| `"isencao"` | Marca `isento = true`, status → `CANCELADO` |
| `"reabrir"` | Volta status para `PENDENTE`, limpa `pagamento` e `isento` |
| `"editar"` | Atualiza campos livres: `valor`, `desconto`, `jurosMulta`, `observacao`, `vencimento` |

Todas as ações gravam `MensalidadeLog` antes de fazer o `update`.

### @base-ui/react — DialogTrigger

**Não suporta `asChild`** como o Radix UI. Usar a prop `render`:
```tsx
<DialogTrigger render={<Button variant="outline">Abrir</Button>} />
```

### Roteamento por Role

| Role | Destino pós-login |
|------|------------------|
| MEMBRO | `/feed` |
| Demais | `/` (dashboard) |

Se `mustChangePassword === true`, redireciona para `/trocar-senha` antes de qualquer rota.
