# Spec — Módulo de Mensageria (Outbound)

**Versão:** 1.0 · **Atualização:** Julho 2026  
**Status:** Planejamento

---

## 1. Visão e Posicionamento

Mensageria é **infraestrutura transversal** — não pertence ao módulo financeiro, nem ao de comunicados, nem a qualquer outro. É uma camada de serviço que qualquer módulo chama para enviar uma notificação para fora do sistema.

```
Módulo Financeiro ──┐
Módulo Comunicados ──┤
Módulo Sessões ──────┤──► Módulo Mensageria ──► Email (SMTP)
Módulo Membros ──────┤                      ──► WhatsApp (link / API)
Módulo Feed ─────────┘                      ──► SMS (futuro)
                                            ──► Push Notification (futuro)
```

O sistema hoje tem comunicação **somente in-app** (badge de comunicados com polling de 60s). Este módulo adiciona canais de saída reais.

---

## 2. Canais

### 2.1 Email via SMTP
- Protocolo universal, sem dependência de plataforma terceira
- Qualquer servidor: Gmail, Zoho, Outlook, cPanel, servidor próprio
- Credenciais configuráveis via frontend (senha criptografada — ver seção 7)
- Biblioteca: `nodemailer` (`npm install nodemailer @types/nodemailer`)

### 2.2 WhatsApp
**Fase A — Link assistido (MVP, zero custo):**  
Gera link `wa.me/55NUMERO?text=MSG` que o operador clica. Mantém o toque humano — útil para cobrança e situações sensíveis.

**Fase B — WhatsApp Business API (futuro):**  
Envio automático via gateway (Zapi, Evolution API, ou Twilio). Requer número comercial dedicado, aprovação de templates pela Meta. Custo: ~R$ 0,15–0,50/mensagem.

### 2.3 SMS (futuro)
Via Twilio, Zenvia ou similar. Custo por mensagem. Útil quando o membro não tem WhatsApp ou email. Fase futura.

### 2.4 Push Notification (futuro)
Web Push API com service worker. Requer PWA instalada e permissão explícita do usuário. Fase futura, junto com a conversão para PWA.

---

## 3. Eventos Notificáveis (mapa por módulo)

Cada evento tem: **gatilho** (o que dispara), **destinatário** (quem recebe), **canais sugeridos** (por prioridade), **urgência** (imediata ou agendada).

### 3.1 Financeiro

| Evento | Destinatário | Canais | Urgência |
|--------|-------------|--------|----------|
| Mensalidade vencendo em N dias | Membro | Email, WhatsApp | Agendada (D-5, D-1) |
| Mensalidade vencida | Membro | Email, WhatsApp | Agendada (D+1) |
| Pagamento confirmado | Membro | Email | Imediata |
| Acordo registrado | Membro | Email | Imediata |

### 3.2 Comunicados

| Evento | Destinatário | Canais | Urgência |
|--------|-------------|--------|----------|
| Novo comunicado recebido | Membros destinatários | Email, Push | Imediata |
| Comunicado urgente | Membros destinatários | Email + WhatsApp | Imediata |

### 3.3 Sessões

| Evento | Destinatário | Canais | Urgência |
|--------|-------------|--------|----------|
| Nova sessão agendada | Todos os membros ativos | Email | Imediata |
| Lembrete de sessão (D-2) | Todos os membros ativos | Email, WhatsApp, Push | Agendada |
| Presença negativa acumulada | Membro + Admin | Email | Agendada (semanal) |

### 3.4 Membros / Datas

| Evento | Destinatário | Canais | Urgência |
|--------|-------------|--------|----------|
| Aniversário de membro (dia) | Admin / Secretário | Email, WhatsApp | Agendada (manhã) |
| Aniversário maçônico (iniciação, elevação, exaltação) | Admin + Membro | Email | Agendada |
| Conta de acesso criada | Membro | Email | Imediata |
| Senha resetada | Membro | Email | Imediata |

### 3.5 Feed / Classificados

| Evento | Destinatário | Canais | Urgência |
|--------|-------------|--------|----------|
| Comentário no seu post | Autor do post | Push, Email (resumo diário) | Configurável |
| Reação no seu post | Autor do post | Push | Configurável |
| Classificado expirando | Autor | Email | Agendada (D-3) |

---

## 4. Modelo de Dados

### 4.1 Preferências de Notificação por Membro

```prisma
model NotificacaoPreferencia {
  id        String  @id @default(cuid())
  memberId  String  @unique
  member    Member  @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Canais habilitados
  emailAtivo   Boolean @default(true)
  whatsappAtivo Boolean @default(false)  // só ativo se membro tiver número e isWhatsapp
  pushAtivo    Boolean @default(false)   // só ativo se tiver subscription cadastrada

  // Por categoria de evento
  receberFinanceiro   Boolean @default(true)   // mensalidades, pagamentos
  receberSessoes      Boolean @default(true)   // lembretes de sessão
  receberComunicados  Boolean @default(true)   // novos comunicados
  receberFeed         Boolean @default(false)  // comentários, reações (opt-in)
  receberAniversarios Boolean @default(true)   // aniversários próprios

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notificacao_preferencias")
}
```

### 4.2 Log de Envios

```prisma
model NotificacaoLog {
  id          String   @id @default(cuid())
  memberId    String?  // null = envio para grupo sem destinatário específico
  canal       String   // "email" | "whatsapp" | "sms" | "push"
  evento      String   // "mensalidade_vencendo" | "sessao_lembrete" | etc.
  status      String   // "enviado" | "falhou" | "ignorado" (preferência desligada)
  erro        String?  // mensagem de erro se status === "falhou"
  metadata    Json?    // dados extras (assunto do email, número WhatsApp, etc.)
  createdAt   DateTime @default(now())

  @@index([memberId])
  @@index([canal])
  @@index([evento])
  @@index([createdAt])
  @@map("notificacao_logs")
}
```

### 4.3 Push Subscriptions (futuro)

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  memberId  String
  member    Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())

  @@map("push_subscriptions")
}
```

### 4.4 Configuração SMTP em ConfigLoja

Credenciais de email ficam em `ConfigLoja` (editáveis via frontend), com a senha criptografada:

```prisma
// Adicionar em ConfigLoja:
smtpHost           String?
smtpPort           Int?       @default(587)
smtpSecure         Boolean    @default(false)
smtpUser           String?
smtpPassEncrypted  String?    // AES-256-GCM — nunca texto plano
emailRemetente     String?    // ex: financeiro@lojaitapetinga.com.br
emailNomeRemetente String?    // ex: Tesouraria Loja Itapetinga
```

> **Segurança:** A chave de criptografia `ENCRYPTION_KEY` fica **somente** no `.env`/Vercel env vars — nunca no banco. Ver seção 7.

---

## 5. Arquitetura de Serviço

### 5.1 Interface central — `src/lib/mensageria/index.ts`

Um único ponto de entrada para todos os módulos. Nenhum módulo importa `nodemailer` diretamente.

```typescript
// src/lib/mensageria/index.ts

export type Evento =
  | "mensalidade_vencendo"
  | "mensalidade_vencida"
  | "pagamento_confirmado"
  | "sessao_agendada"
  | "sessao_lembrete"
  | "comunicado_recebido"
  | "conta_criada"
  | "senha_resetada"
  | "aniversario_membro"
  | "classificado_expirando"

export type Payload = {
  memberId: string
  evento: Evento
  dados: Record<string, string | number>  // variáveis para o template
}

export async function notificar(payload: Payload): Promise<void> {
  // 1. Busca preferências do membro
  // 2. Para cada canal ativo nas preferências:
  //    - Renderiza template do evento para o canal
  //    - Envia pelo canal correspondente
  //    - Registra no NotificacaoLog
}

// Para envio em lote (ex: lembrete de sessão para todos)
export async function notificarLote(
  memberIds: string[],
  evento: Evento,
  dados: Record<string, string | number>
): Promise<{ enviados: number; falhas: number }>
```

### 5.2 Estrutura de arquivos

```
src/lib/mensageria/
  index.ts          # ponto de entrada público (notificar, notificarLote)
  canais/
    email.ts        # getTransporter() + enviar()
    whatsapp.ts     # gerarLink() + (futuro) enviarAPI()
    sms.ts          # (futuro)
    push.ts         # (futuro)
  templates/
    email/
      mensalidade-vencendo.html
      mensalidade-vencida.html
      pagamento-confirmado.html
      sessao-lembrete.html
      comunicado-recebido.html
      conta-criada.html
      senha-resetada.html
    whatsapp/
      mensalidade-vencendo.ts   # função que retorna string
      sessao-lembrete.ts
  eventos.ts        # mapa evento → { canal[], template }
```

### 5.3 Templates de email

Templates HTML simples, sem dependência de biblioteca de template. Variáveis substituídas com replace:

```typescript
// src/lib/mensageria/templates/email/render.ts
export function renderTemplate(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    html
  )
}
```

Template base (layout): header com logo/nome da Loja, corpo, rodapé com "Para cancelar notificações, acesse seu perfil".

---

## 6. API Routes

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/admin/mensageria/config` | ADMIN | Lê config SMTP + status dos canais |
| PUT | `/api/admin/mensageria/config` | ADMIN | Salva config SMTP (senha criptografada) |
| POST | `/api/admin/mensageria/testar` | ADMIN | Testa conexão SMTP e envia email de teste |
| GET | `/api/admin/mensageria/logs` | ADMIN | Histórico de envios com filtros |
| GET | `/api/admin/mensageria/logs/[id]` | ADMIN | Detalhe de um envio (erro, metadata) |
| POST | `/api/admin/mensageria/disparar` | ADMIN | Disparo manual de evento para membros selecionados |
| GET | `/api/me/notificacoes` | Autenticado | Preferências de notificação do membro logado |
| PUT | `/api/me/notificacoes` | Autenticado | Salva preferências do membro logado |

---

## 7. Segurança — Criptografia da Senha SMTP

A senha SMTP **jamais** é salva em texto plano. Criptografia AES-256-GCM com chave mestra no ambiente.

**Variável obrigatória no `.env` e no Vercel:**
```env
ENCRYPTION_KEY=<hex 64 chars>   # gerar uma vez: openssl rand -hex 32
```

**`src/lib/crypto.ts`:**
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex")

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map(b => b.toString("base64")).join(":")
}

export function decrypt(stored: string): string {
  const [ivB64, tagB64, encB64] = stored.split(":")
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const encrypted = Buffer.from(encB64, "base64")
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final("utf8")
}
```

**O que a API retorna (GET config):**
```typescript
{
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "financeiro@lojaitapetinga.com.br",
  smtpPassConfigured: true,   // boolean — nunca o valor real
  emailRemetente: "...",
  emailNomeRemetente: "...",
}
```

**Frontend `/admin/mensageria`:**
- Campo senha: exibe `••••••••` quando configurada; campo vazio ao salvar = mantém senha anterior
- Botão "Testar conexão" → autentica no SMTP + envia email de teste para o admin logado

---

## 8. Telas

### 8.1 `/admin/mensageria` — Painel de Mensageria (ADMIN only)

**Aba: Configuração**
- Seção SMTP: host, porta, seguro (toggle), usuário, senha (masked), nome/email remetente
- Botão "Testar conexão" com feedback inline (✅ Conectado / ❌ Erro: mensagem)
- Seção WhatsApp: toggle "Usar link assistido" (MVP) / "API WhatsApp Business" (futuro, locked)
- Seção Push: status "Não configurado" com link para documentação (futuro)
- Seção SMS: "Em breve" (futuro)

**Aba: Eventos**
- Lista de todos os eventos notificáveis com toggle por canal
- Ex: "Lembrete de sessão" → Email ✅ · WhatsApp ✅ · Push ☐ · SMS ☐
- Configuração de timing (D-2, D-1, etc.) para eventos agendados

**Aba: Logs**
- Tabela: Data | Membro | Evento | Canal | Status (badge) | Ações
- Filtros: canal, evento, status (enviado/falhou), período
- Linha com status "falhou": botão "Ver erro" → expande mensagem de erro
- Botão "Reenviar" para envios que falharam

**Aba: Disparo Manual**
- Seletor de evento
- Seletor de membros (todos / selecionar individualmente)
- Pré-visualização do conteúdo que será enviado
- Botão "Enviar" com confirmação: "Serão enviados X emails para Y membros"

### 8.2 `/perfil` — Aba "Notificações" (Membro)

- Seção "Canais": Email (sempre visível) / WhatsApp (visível se isWhatsapp = true)
- Seção "O que receber":
  - Financeiro (mensalidades, pagamentos) — padrão: ativado
  - Sessões (novas sessões, lembretes) — padrão: ativado
  - Comunicados — padrão: ativado
  - Feed (comentários, reações) — padrão: desativado (opt-in)
  - Datas comemorativas — padrão: ativado
- Salvar → toast de sucesso
- Aviso: "Desativar notificações financeiras pode fazer você perder avisos de mensalidade em aberto"

---

## 9. Automação — Vercel Cron

Eventos agendados (lembretes, vencimentos) precisam de um processo que roda periodicamente.

**`vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/mensageria", "schedule": "0 9 * * *" }
  ]
}
```
> Vercel Cron requer plano Pro ($20/mês). Alternativa gratuita: cron externo (cron-job.org) chamando a rota com um secret no header.

**`/api/cron/mensageria/route.ts`:**
```typescript
// Protegido por CRON_SECRET no header Authorization
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const hoje = new Date()
  const em5dias = addDays(hoje, 5)

  // Mensalidades vencendo em 5 dias
  const vencendoEmBreve = await prisma.mensalidade.findMany({
    where: {
      status: "PENDENTE",
      vencimento: { gte: startOfDay(em5dias), lte: endOfDay(em5dias) },
      emailAvisoEm: null, // ainda não notificado
    },
    include: { member: true },
  })
  for (const m of vencendoEmBreve) {
    await notificar({ memberId: m.memberId, evento: "mensalidade_vencendo", dados: { ... } })
    await prisma.mensalidade.update({ where: { id: m.id }, data: { emailAvisoEm: hoje } })
  }

  // Sessões com lembrete D-2
  // Aniversários do dia
  // etc.
}
```

**`CRON_SECRET`:** variável de ambiente gerada uma vez (`openssl rand -hex 16`). Configura no Vercel e no serviço de cron externo.

---

## 10. Plano de Implementação

| Fase | O que entrega | Depende de | Esforço |
|------|--------------|-----------|---------|
| M1 — Infra base | `src/lib/mensageria/` + `src/lib/crypto.ts` + modelo `NotificacaoLog` + `NotificacaoPreferencia` | — | 1 dia |
| M2 — Canal email | `canais/email.ts` + templates base + tela `/admin/mensageria` (config + teste) | M1 | 1–2 dias |
| M3 — Eventos financeiros | `notificar()` chamado pelo módulo financeiro (vencendo, vencida, pago) | M2 + Módulo Financeiro Fase 2 | 1 dia |
| M4 — Preferências do membro | `NotificacaoPreferencia` + aba "Notificações" no perfil | M1 | 1 dia |
| M5 — Logs e disparo manual | Aba Logs + Aba Disparo Manual no painel admin | M2 | 1–2 dias |
| M6 — Cron automático | `/api/cron/mensageria` com todos os eventos agendados | M3 + Vercel Pro ou cron externo | 1–2 dias |
| M7 — Eventos de sessões e datas | Lembretes de sessão, aniversários | M6 | 1 dia |
| M8 — WhatsApp link assistido | `canais/whatsapp.ts` + UI de disparo no painel | M5 | 1 dia |
| M9 — Push Notifications | Service worker + subscriptions + canal push | M1 + PWA | 5–7 dias |
| M10 — WhatsApp Business API | Gateway externo + templates Meta | Conta PJ + aprovação Meta | 7–10 dias |
| M11 — SMS | Twilio/Zenvia + canal SMS | Contrato com operadora | 3–5 dias |

**MVP recomendado: M1 → M2 → M3 → M4 → M5** (~5–7 dias de desenvolvimento)

---

## 11. Roteiro de Testes

**T-M1 — Configuração SMTP (admin)**
1. Login ADMIN → `/admin/mensageria` aba Configuração
2. Preencher credenciais SMTP → salvar → recarregar: senha mostra `••••••••`
3. "Testar conexão" → email de teste chega na caixa do admin
4. Credencial errada → "Testar" → erro legível exibido inline
5. Editar outros campos sem preencher senha → salvar → senha anterior mantida
6. `GET /api/admin/mensageria/config` → JSON não contém senha, contém `smtpPassConfigured: true`

**T-M2 — Preferências do membro**
1. Login MEMBRO → `/perfil` aba Notificações
2. Desativar "Sessões" → salvar → toast sucesso
3. Nova sessão criada → membro **não** recebe email (preferência off)
4. Reativar "Sessões" → nova sessão → email chega
5. WhatsApp toggle visível só se `isWhatsapp = true` no perfil

**T-M3 — Logs de envio**
1. Disparar qualquer notificação → log criado com status "enviado"
2. SMTP desconfigurado → notificação → log com status "falhou" + mensagem de erro
3. Membro com preferência desativada → log com status "ignorado"
4. Filtrar logs por canal "email" → só emails aparecem
5. "Reenviar" em log com falha → nova tentativa → novo log criado

**T-M4 — Disparo manual (admin)**
1. Aba Disparo Manual → selecionar evento "sessao_lembrete" → selecionar 3 membros
2. Pré-visualização exibe o conteúdo do email com os dados corretos
3. Confirmar → toast "3 emails enviados"
4. Membros com preferência "Sessões" desativada → aparecem na lista mas com aviso "preferência desativada"

**T-M5 — Isolamento de roles**
1. Login FINANCEIRO → `/admin/mensageria` → 403 (painel só para ADMIN)
2. Login MEMBRO → `/admin/mensageria` → 403
3. Login MEMBRO → `/perfil` aba Notificações → funciona (próprias preferências)
4. `PUT /api/me/notificacoes` com memberId de outro membro no body → deve ignorar, usar o do token

---

## 12. Dependência entre Módulos

```
spec-modulo-financeiro.md
  └── usa notificar() da mensageria para:
      mensalidade_vencendo, mensalidade_vencida, pagamento_confirmado

spec-modulo-financeiro-notificacoes.md  ← referência histórica
  └── conceitos migrados para esta spec

spec-modulo-mensageria.md  ← esta spec
  └── infraestrutura usada por todos os módulos
```

O módulo financeiro **não** implementa email diretamente. Ele chama `notificar()` e a mensageria resolve qual canal usar, se o membro quer receber, e registra o log.
