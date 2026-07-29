# Guia de Desenvolvimento

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env.local
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# 3. Gerar client Prisma
npx prisma generate

# 4. Rodar migrations pendentes
npx prisma migrate deploy

# 5. Iniciar dev server
npm run dev
```

> Turbopack está habilitado. O servidor usa porta 3000.

---

## Após Alterar o Schema Prisma

```bash
# Criar migration
npx prisma migrate dev --name descricao-da-mudanca

# Regenerar client (feito automaticamente pelo postinstall no Vercel)
npx prisma generate

# Reiniciar o dev server para pegar o novo client
```

O Vercel regenera o client via `postinstall: "prisma generate"` em cada deploy.

---

## Regras Críticas — Neon HTTP

O banco usa HTTP mode (sem transações). Violações causam erro 500 em produção.

**NUNCA fazer:**
```typescript
// ❌ Nested create (transação implícita)
prisma.post.create({
  data: { texto, member: { connect: { id } }, comentarios: { create: [...] } }
})

// ❌ createMany com skipDuplicates (transação implícita)
prisma.item.createMany({ data: [...], skipDuplicates: true })

// ❌ create com include (Neon HTTP pode falhar dependendo da complexidade)
prisma.post.create({ data: {...}, include: { member: true } })
```

**SEMPRE fazer:**
```typescript
// ✅ create simples → findUnique separado
const record = await prisma.post.create({ data: { ...campos } })
const result  = await prisma.post.findUnique({
  where: { id: record.id },
  include: { member: true, reacoes: true }
})

// ✅ Múltiplos inserts: parallel individual creates
await Promise.all(
  items.map(item =>
    prisma.model.create({ data: item }).catch(() => null)
  )
)
```

---

## Padrão de API Route

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({ campo: z.string().min(1) })

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any

  // 2. Permissão
  if (!["ADMIN"].includes(user?.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  // 3. Validação
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // 4. Operação (create sem include)
  const record = await prisma.model.create({ data: { ...parsed.data } })

  // 5. Busca resultado com include
  const result = await prisma.model.findUnique({ where: { id: record.id }, include: { ... } })

  return NextResponse.json(result, { status: 201 })
}
```

---

## Padrão de Page Client-Side

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function MinhaPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["minha-chave"],
    queryFn: () => fetch("/api/minha-rota").then(r => r.json()),
  })

  const mutation = useMutation({
    mutationFn: (body) => fetch("/api/minha-rota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minha-chave"] })
      toast.success("Salvo!")
    },
  })
}
```

---

## DialogTrigger — base-ui

```tsx
// ❌ ERRADO: asChild não existe no @base-ui/react
<DialogTrigger asChild>
  <Button>Abrir</Button>
</DialogTrigger>

// ✅ CORRETO: prop render
<DialogTrigger render={<Button variant="outline">Abrir</Button>} />
```

---

## Upload de Imagens

```typescript
// Client: FormData → /api/upload
const form = new FormData()
form.append("file", file)
const res = await fetch("/api/upload", { method: "POST", body: form })
const { url, key } = await res.json()
// url: https://blob.vercel-storage.com/...
// key: pathname para deletar depois se necessário
```

Limite: 5 MB, tipos aceitos: JPEG, PNG, WebP, GIF.

---

## Variáveis de Ambiente

| Variável | Onde usar | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | Prisma (pooled) | ✅ |
| `DATABASE_URL_UNPOOLED` | Migrations | ✅ |
| `AUTH_SECRET` | NextAuth | ✅ |
| `NEXTAUTH_URL` | NextAuth | Dev only |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | ✅ |

---

## Comandos Úteis

```bash
# Ver schema atual do banco
npx prisma studio

# Reset completo do banco (CUIDADO — apaga tudo)
npx prisma migrate reset

# Verificar migrations pendentes
npx prisma migrate status

# Gerar tipos sem rodar migration
npx prisma generate

# Build de produção local
npm run build && npm start
```
