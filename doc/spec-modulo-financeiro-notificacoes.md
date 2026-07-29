# Spec — Notificações e Cobrança de Mensalidades

**Versão:** 1.0 · **Atualização:** Julho 2026  
**Status:** Planejamento — complementa `spec-modulo-financeiro.md`

---

## 1. O Problema Real

Cobrar mensalidade de irmão de Loja é delicado. O Tesoureiro enfrenta dois problemas opostos:

**Problema 1 — Alcance:** O membro não abre o sistema. Notificações in-app não alcançam quem não loga. Para que o banner de "mensalidade em aberto" funcione, o membro precisa entrar no sistema — e inadimplentes costumam ser justamente quem menos entra.

**Problema 2 — Tom:** Cobrar numa Loja Maçônica exige cuidado. Uma mensagem de cobrança fria e automática pode ser percebida como falta de fraternidade. O ideal é que a comunicação pareça vir do Tesoureiro, não de um robô.

**A solução não é só técnica.** É um sistema que:
1. Informa proativamente pelo canal certo (onde o membro já está)
2. Mantém o tom fraternal
3. Reduz o trabalho manual do Tesoureiro ao mínimo
4. Dá ao membro autonomia para resolver sem precisar ligar pra ninguém

---

## 2. Canais Disponíveis (análise de viabilidade)

### 2.1 In-app (já existe)
- Banner no feed ao fazer login
- Badge de comunicados na sidebar
- Aba Financeiro no perfil

**Alcance:** Baixo — só funciona para quem já abre o sistema  
**Tom:** Neutro — sem constrangimento  
**Custo:** Zero — já implementado  
**Veredicto:** Necessário mas insuficiente sozinho

---

### 2.2 WhatsApp (link `wa.me`)
O que existe hoje: link gerado manualmente pelo Tesoureiro, abre WhatsApp Web com mensagem pré-formatada. Funciona, mas exige ação manual para cada membro.

**Alcance:** Muito alto — quase 100% dos membros usam WhatsApp  
**Tom:** Pode ser fraternal (texto personalizável)  
**Custo:** Zero (link direto, sem API)  
**Limitação:** Manual — Tesoureiro precisa clicar um por um  
**Veredicto:** Melhor canal individual; automatizar o fluxo, não o envio

---

### 2.3 WhatsApp Business API (Twilio, Zapi, Evolution API)
Envio automático via API. Requer número comercial dedicado, aprovação de templates pela Meta, custo por mensagem (~R$ 0,15–0,50/mensagem).

**Alcance:** Muito alto  
**Tom:** Controlado por template aprovado pela Meta — menos flexível  
**Custo:** R$ 7–25/mês + R$ 0,15–0,50/msg enviada. Para 52 membros/mês: ~R$ 30–50 extra  
**Complexidade:** Alta — número verificado, conta Business Meta, aprovação de templates  
**Veredicto:** Poderoso, mas complexidade desproporcional para MVP. Fase futura.

---

### 2.4 Email via SMTP (Nodemailer)
Usa qualquer servidor de email existente: Gmail, Zoho, Outlook, ou servidor próprio da Loja. Sem dependência de serviço terceiro, sem SDK proprietário, sem custo adicional se o email já existir.

**Alcance:** Médio — nem todos os membros têm email cadastrado ou leem regularmente  
**Tom:** Formal; personalizável com HTML  
**Custo:** Zero — usa infraestrutura de email já existente  
**Complexidade:** Baixa — `npm install nodemailer`, configurar variáveis SMTP  
**Pré-requisito:** Uma conta de email para ser o remetente (Gmail com App Password, Zoho free, ou email corporativo da Loja)  
**Veredicto:** Complemento ideal ao WhatsApp. Zero custo adicional. **Recomendado para MVP.**

---

### 2.5 Comunicado interno (já existe)
O sistema de Comunicados já permite enviar mensagem para todos os membros ou selecionados, com badge in-app. Pode ser usado pelo Tesoureiro para enviar um lembrete geral.

**Alcance:** Só quem abre o sistema  
**Tom:** Fraternal (o próprio Tesoureiro escreve)  
**Custo:** Zero  
**Veredicto:** Usar como canal de lembrete coletivo, não individual. Já está pronto.

---

### 2.6 Push Notifications (Web Push API / PWA)
Requer service worker, permissão explícita do usuário, e infraestrutura de servidor push (ex: web-push library + banco de subscriptions).

**Alcance:** Médio — só quem aceitou a permissão e instalou como PWA  
**Complexidade:** Alta  
**Veredicto:** Fase futura, junto com PWA.

---

## 3. Estratégia Recomendada (por camadas)

```
Camada 1 — Automática, silenciosa (in-app)
  → Banner no feed + badge de comunicados
  → Aba Financeiro no perfil
  → Sem ação do Tesoureiro

Camada 2 — Automática, proativa (email)
  → Email de aviso D-5 antes do vencimento
  → Email de cobrança D+1 após vencimento
  → Tom fraternal, assina como "Tesouraria da Loja"
  → Zero trabalho do Tesoureiro

Camada 3 — Manual assistida (WhatsApp)
  → Botão "Notificar todos inadimplentes" na tela do Tesoureiro
  → Abre links wa.me sequencialmente (ou lista em uma tela)
  → Tesoureiro revisa e envia — mantém o toque humano
  → Para casos específicos: acordos, situações sensíveis

Camada 4 — Coletiva (Comunicado)
  → Tesoureiro envia comunicado geral antes da Sessão Econômica
  → "Lembramos que mensalidades de julho vencem dia 10"
  → Já implementado — basta usar
```

---

## 4. Proposta de Implementação

### 4.1 Email via SMTP com Nodemailer (Camada 2)

SMTP é a escolha mais simples: sem conta em serviço terceiro, sem SDK proprietário, funciona com qualquer servidor de email — Gmail, Outlook, Zoho, servidor próprio, ou o email corporativo da Loja que já existir.

**Setup:**
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

**Variáveis de ambiente:**
```env
SMTP_HOST=smtp.gmail.com          # ou smtp.zoho.com, mail.seudominio.com.br, etc.
SMTP_PORT=587                     # 587 (STARTTLS) ou 465 (SSL)
SMTP_SECURE=false                 # true apenas para porta 465
SMTP_USER=financeiro@lojaitapetinga.com.br
SMTP_PASS=senha_ou_app_password   # Gmail: usar App Password, não a senha normal
SMTP_FROM="Tesouraria Loja Itapetinga <financeiro@lojaitapetinga.com.br>"
```

> **Gmail:** Ativar verificação em duas etapas → gerar App Password em myaccount.google.com/apppasswords. Usar o App Password no `SMTP_PASS`, nunca a senha da conta.  
> **Zoho Mail** (recomendado para domínio próprio): plano gratuito com até 5 contas e 5 GB — ideal para `financeiro@lojaitapetinga.com.br`.  
> **Servidor próprio / cPanel / Hostinger:** usar as credenciais do painel de email.

**Arquivo:** `src/lib/email.ts`
```typescript
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function enviarEmailMensalidade(params: {
  destinatario: string
  nome: string
  competencia: string    // "Julho de 2026"
  valor: string          // "R$ 80,00"
  vencimento: string     // "10 de julho de 2026"
  pixChave: string
  pixTipo: string        // "e-mail" | "CNPJ" | "telefone" | "aleatória"
  pixBeneficiario: string
  tipo: "aviso" | "vencido"
}) {
  const assunto = params.tipo === "aviso"
    ? `Lembrete fraternal: mensalidade de ${params.competencia} vence em breve`
    : `Mensalidade de ${params.competencia} em aberto`

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.destinatario,
    subject: assunto,
    html: emailTemplate(params),
    text: emailTemplatePlain(params), // fallback para clientes sem HTML
  })
}
```

**Template de email — aviso (D-5):**
```
Querido Ir. [Nome],

Este é um lembrete fraternal: sua mensalidade referente a [Julho de 2026]
no valor de R$ 80,00 vence em [10 de julho de 2026].

Para regularizar, utilize:
  Chave PIX: financeiro@lojaitapetinga.com.br
  Beneficiário: Loja Itapetinga

Caso já tenha efetuado o pagamento, desconsidere este aviso.

Fraternalmente,
Tesouraria — Loja Itapetinga
```

**Template de email — vencido (D+1):**
```
Querido Ir. [Nome],

Verificamos que sua mensalidade de [Julho de 2026] (R$ 80,00)
ainda consta em aberto em nossos registros.

Caso tenha efetuado o pagamento recentemente, ele pode ainda
estar sendo processado — aguarde 1 dia útil.

Para regularizar:
  Chave PIX: financeiro@lojaitapetinga.com.br
  Beneficiário: Loja Itapetinga

Em caso de dificuldades, entre em contato com a Tesouraria.

Fraternalmente,
Tesouraria — Loja Itapetinga
```

---

### 4.2 Disparo de Emails — Quando e Como

**Opção A — Manual (MVP, sem cron):**
Botão "Enviar lembretes por email" na tela do Tesoureiro. Ao clicar, dispara emails para todos com mensalidade PENDENTE com vencimento em até 5 dias, ou todos com VENCIDO. Tesoureiro controla quando enviar.

**Opção B — Automático (pós-MVP, com Vercel Cron):**
```typescript
// vercel.json
{
  "crons": [
    { "path": "/api/cron/lembretes-email", "schedule": "0 9 * * *" }  // 09h todo dia
  ]
}
```
Rota `/api/cron/lembretes-email`:
- Busca mensalidades PENDENTE com `vencimento === hoje + 5 dias` → envia aviso
- Busca mensalidades PENDENTE com `vencimento === ontem` → muda para VENCIDO + envia cobrança
- Registra `emailEnviadoEm` no registro de mensalidade para não reenviar

**Recomendação:** Começar com Opção A (zero infra adicional). Migrar para B quando o volume justificar.

**Campo adicional no model `Mensalidade` (para Opção B):**
```prisma
emailAvisoEm   DateTime?   // data em que o email de aviso foi enviado
emailVencidoEm DateTime?   // data em que o email de vencido foi enviado
```

---

### 4.3 WhatsApp Assistido em Lote (Camada 3)

Em vez de o Tesoureiro clicar membro por membro, uma tela de "Disparos WhatsApp":

**Tela `/financeiro/notificacoes`:**
- Lista todos os inadimplentes com checkbox
- Selecionar todos ou individualmente
- Botão "Gerar lista de contatos" → expande cada linha com:
  - Nome do irmão
  - Valor em aberto
  - Botão "Abrir WhatsApp" → `wa.me/...`
- Alternativamente: botão "Copiar todos os números" → lista de telefones para criar grupo no WhatsApp

**Por que não abrir todos de uma vez automaticamente?**  
Navegadores bloqueiam múltiplos `window.open()` automáticos como popup. E o Tesoureiro deve revisar cada caso antes de enviar — um membro pode estar doente, em luto, ou já ter feito acordo verbal.

---

### 4.4 Comunicado de Lembrete Coletivo (Camada 4)

Fluxo já existente, mas documentar o uso financeiro:

**Fluxo recomendado para o Tesoureiro (antes da Sessão Econômica):**
1. Acessar `/comunicados/novo`
2. Selecionar "Todos os membros"
3. Marcar "Publicar no mural também"
4. Escrever:
   > "Irmãos, lembramos que as mensalidades de julho vencem no dia 10. Para informações sobre pagamento, entre em contato com a Tesouraria."
5. Enviar → aparece no mural + notificação in-app para todos

Isso já funciona hoje. O Tesoureiro só precisa ser orientado a usar.

---

## 5. Modelo de Dados — Adições

### 5.1 Rastreio de envios em Mensalidade

```prisma
// Em Mensalidade — adicionar:
emailAvisoEm    DateTime?   // Email de aviso pré-vencimento enviado em
emailVencidoEm  DateTime?   // Email de cobrança pós-vencimento enviado em
```

### 5.2 Configuração SMTP em ConfigLoja

As configurações SMTP ficam no banco (editáveis via frontend) com uma exceção crítica: **a senha é criptografada antes de salvar**.

```prisma
// Em ConfigLoja — adicionar:
smtpHost          String?   // ex: "smtp.gmail.com"
smtpPort          Int?      // ex: 587
smtpSecure        Boolean   @default(false)   // true para porta 465
smtpUser          String?   // ex: "financeiro@lojaitapetinga.com.br"
smtpPassEncrypted String?   // senha criptografada com AES-256-GCM (nunca texto plano)
emailRemetente    String?   // ex: "financeiro@lojaitapetinga.com.br"
emailNomeRemetente String?  // ex: "Tesouraria Loja Itapetinga"
```

### 5.3 Segurança — Criptografia da Senha SMTP

A senha SMTP **jamais** é salva em texto plano no banco. Se o banco vazar, as credenciais de email não vão junto.

**Mecanismo:** AES-256-GCM com uma chave mestra que fica **somente** no ambiente (`.env`).

```env
# .env — nunca no banco, nunca commitado
ENCRYPTION_KEY=hex-de-64-chars-gerado-uma-vez  # openssl rand -hex 32
```

**`src/lib/crypto.ts`:**
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex") // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  // formato: iv(12):tag(16):encrypted — tudo base64
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

**Fluxo de salvar:**
```typescript
// PUT /api/admin/config
const smtpPassEncrypted = body.smtpPass ? encrypt(body.smtpPass) : undefined
await prisma.configLoja.upsert({
  where: { id: "singleton" },
  update: { smtpHost, smtpPort, smtpUser, smtpPassEncrypted, ... },
  create: { id: "singleton", smtpHost, smtpPort, smtpUser, smtpPassEncrypted, ... },
})
```

**Fluxo de usar:**
```typescript
// src/lib/email.ts
import { decrypt } from "./crypto"

export async function getTransporter() {
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPassEncrypted) {
    throw new Error("SMTP não configurado. Acesse /admin/config para configurar.")
  }
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: decrypt(config.smtpPassEncrypted), // descriptografa só aqui
    },
  })
}
```

**O que a API retorna para o frontend (GET /api/admin/config):**
```typescript
// NUNCA retornar smtpPassEncrypted
// Retornar apenas se há senha configurada:
{
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "financeiro@lojaitapetinga.com.br",
  smtpPassConfigured: true,  // boolean — o frontend mostra "••••••••" ou "Não configurada"
  emailRemetente: "financeiro@lojaitapetinga.com.br",
  emailNomeRemetente: "Tesouraria Loja Itapetinga",
}
```

**No frontend (`/admin/config`):**
- Campo senha exibe `••••••••` quando já há senha salva
- Campo vazio ao editar = não alterar a senha existente
- Campo preenchido = atualizar com nova senha (nova criptografia)
- Botão "Testar conexão" → chama `POST /api/admin/config/testar-smtp` → tenta autenticar no servidor → retorna ok ou mensagem de erro

---

## 6. Novos Endpoints

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| POST | `/api/financeiro/notificacoes/email` | ADMIN, FINANCEIRO | Dispara emails para membros selecionados (aviso ou vencido) |
| GET | `/api/financeiro/notificacoes/inadimplentes` | ADMIN, FINANCEIRO | Lista inadimplentes com telefone e status de email |
| POST | `/api/cron/lembretes-email` | (cron secret) | Disparo automático diário (Opção B) |
| POST | `/api/admin/config/testar-smtp` | ADMIN | Testa conexão SMTP com as credenciais salvas; envia email de teste para o próprio admin |

---

## 7. Nova Tela — `/financeiro/notificacoes`

**Aba "Notificações" no painel do Tesoureiro:**

**Seção: Enviar lembretes por email**
- Card: "X membros com mensalidade vencendo em 5 dias" → botão "Enviar aviso por email"
- Card: "Y membros com mensalidade vencida" → botão "Enviar cobrança por email"
- Ao clicar: modal de pré-visualização do email + lista de destinatários → confirmar → disparar
- Histórico: tabela com envios anteriores (data, tipo, quantos emails)

**Seção: Contatos WhatsApp**
- Lista de inadimplentes com checkbox
- Por membro: nome + valor + dias de atraso + botão "Abrir WhatsApp"
- Botão "Selecionar todos" + "Abrir selecionados" (abre sequencialmente com confirmação entre cada um)

---

## 8. Roteiro de Testes

**T-N0 — Configuração SMTP via frontend**
1. Login como ADMIN → `/admin/config` aba "Email / SMTP"
2. Preencher: Host `smtp.gmail.com` · Porta `587` · Seguro: não · Usuário: `financeiro@...` · Senha: App Password do Gmail
3. Preencher nome do remetente: "Tesouraria Loja Itapetinga"
4. Salvar → toast de sucesso
5. Recarregar a página → campo senha exibe `••••••••` (não a senha real), demais campos mantêm os valores
6. Clicar "Testar conexão" → sistema autentica no SMTP e envia email de teste para o admin logado → toast "Email de teste enviado para admin@..." → verificar caixa de entrada
7. Inserir senha errada propositalmente → salvar → clicar "Testar conexão" → toast de erro com a mensagem do servidor SMTP (ex: "535 Authentication failed")
8. Campo senha deixado **em branco** ao editar outros campos → salvar → senha anterior mantida (não sobrescreve com vazio)

**T-N0b — Segurança das credenciais**
1. Fazer `GET /api/admin/config` → resposta JSON **não deve conter** `smtpPassEncrypted` nem a senha em texto
2. Resposta deve conter `smtpPassConfigured: true` (boolean)
3. Tentar `GET /api/admin/config` com token de FINANCEIRO → 403
4. Tentar `GET /api/admin/config` com token de MEMBRO → 403

**T-N1 — Email de aviso (disparo manual)**
1. Criar mensalidade PENDENTE com vencimento em 3 dias para membro com email cadastrado
2. Login como ADMIN → `/financeiro/notificacoes`
3. Card "X membros vencendo em breve" exibe o membro
4. Clicar "Enviar aviso" → modal mostra pré-visualização do email e lista de destinatários
5. Confirmar → toast "1 email enviado"
6. Verificar na caixa de entrada: email recebido com tom correto, dados corretos (nome, valor, vencimento, chave PIX)
7. Campo `emailAvisoEm` no banco preenchido com a data/hora de envio

**T-N2 — Email de cobrança (vencido)**
1. Mensalidade com vencimento ontem (status VENCIDO)
2. Clicar "Enviar cobrança" → confirmar → email recebido com template de vencido
3. Campo `emailVencidoEm` preenchido

**T-N3 — Não reenviar duplicata**
1. Email já enviado (`emailAvisoEm` preenchido) → membro não aparece no card "vencendo em breve"
2. Ou: botão desabilitado com tooltip "Email de aviso já enviado em [data]"

**T-N4 — Membro sem email**
1. Membro com email em branco não aparece na lista de destinatários de email
2. Aviso na tela: "3 membros sem email cadastrado não receberão o aviso"
3. Link para completar o cadastro desses membros

**T-N5 — WhatsApp assistido**
1. Seção WhatsApp lista inadimplentes com telefone cadastrado
2. Clicar "Abrir WhatsApp" de um membro → abre wa.me com mensagem pré-formatada correta
3. Membro sem telefone → linha exibe "Sem telefone" (não aparece botão)
4. Selecionar 3 membros → "Abrir selecionados" → abre primeiro, pergunta "Próximo?" → confirmar → abre segundo

**T-N6 — Comunicado coletivo (teste de usabilidade)**
1. Tesoureiro acessa `/comunicados/novo`
2. Escreve lembrete de mensalidade → envia para todos
3. Login como membro → badge de não lidos aparece na sidebar
4. Abrir comunicado → badge some

**T-N7 — Controle de acesso**
1. `POST /api/financeiro/notificacoes/email` com token MEMBRO → 403
2. Tela `/financeiro/notificacoes` com login SECRETARIO → 403 ou redirect

---

## 9. Plano de Implementação (fases)

| Fase | O que entrega | Depende de | Esforço |
|------|--------------|-----------|---------|
| N1 — Setup SMTP + template | `nodemailer` instalado, `src/lib/email.ts` pronto, variáveis SMTP configuradas, testável via API | Módulo Financeiro Fase 1 | 0,5 dia |
| N2 — Disparo manual de email | Tesoureiro envia avisos e cobranças manualmente com pré-visualização | N1 + Fase 2 (mensalidades) | 1–2 dias |
| N3 — Tela de notificações | `/financeiro/notificacoes` com email + WhatsApp assistido | N2 | 2 dias |
| N4 — Cron automático | Emails diários automáticos sem ação do Tesoureiro | N2 + Vercel Pro | 1 dia |
| N5 — WhatsApp Business API | Envio automático sem intervenção humana | Conta PJ + Meta Business | 5–7 dias |

**Recomendação de sequência:** N1 → N2 → N3 em paralelo com Fases 3–4 do módulo financeiro. N4 depois de validar que os emails chegam e são lidos. N5 apenas se N4 não resolver o problema de alcance.

---

## 10. Custo por Canal

| Canal | Custo MVP | Custo com volume |
|-------|-----------|-----------------|
| In-app (banner + badge) | $0 | $0 |
| Email via SMTP (Nodemailer) | $0 — usa email existente | $0 (servidor próprio) ou plano pago do provedor |
| WhatsApp link manual | $0 | $0 |
| WhatsApp Business API | — | ~$50–100/mês (fixo + por mensagem) |
| Vercel Cron (automático) | Requer Vercel Pro ($20/mês) | incluso no Pro |

**Opções de servidor SMTP sem custo:**
- Gmail pessoal com App Password — gratuito, limite de 500 emails/dia (mais que suficiente)
- Zoho Mail gratuito com domínio próprio — 5 GB, 5 contas, ideal para `financeiro@lojaitapetinga.com.br`
- Email corporativo da Loja (cPanel/Hostinger) — se já tiver hospedagem, usa as credenciais SMTP do painel

**Para a Loja Itapetinga (52 membros):**  
Com email SMTP + WhatsApp assistido: **$0 adicional em todos os cenários**.  
Com cron automático: custo do Vercel Pro ($20/mês — provavelmente já necessário por outras razões).
