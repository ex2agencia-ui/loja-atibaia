# Spec — Módulo Financeiro

**Versão:** 2.1 · **Atualização:** Julho 2026  
**Status:** Pré-implementação — decisões de design finalizadas, pronto para Fase 1

---

## 1. Contexto e Problema

A Loja Itapetinga hoje controla finanças em planilhas Excel mantidas pelo Tesoureiro. Os problemas:

- **Inadimplência invisível:** Ninguém além do Tesoureiro sabe quem está em dia
- **Cobrança manual e constrangedora:** Tesoureiro precisa ligar/whatsapp individualmente
- **Sem histórico auditável:** Quem pagou o quê, quando e como está numa planilha pessoal
- **Regularidade opaca:** A grande loja exige regularidade (presença + anuidade), mas o sistema só rastreia presença
- **Caixa sem rastreabilidade:** Despesas do templo, Tronco de Solidariedade, Ágape — sem registro formal

**O que o módulo financeiro resolve:**
- Tesoureiro lança pagamentos e despesas no sistema, não em planilha
- Membro vê seu status financeiro ao fazer login (sem constrangimento)
- Admin e Tesoureiro têm dashboard de inadimplência e fluxo de caixa
- Base para futura automação com PIX/boleto

---

## 2. Análise e Decisões de Design

### 2.1 O que já existe e facilita a implementação

| Recurso | Onde | Como ajuda |
|---------|------|-----------|
| Role `FINANCEIRO` | `src/lib/permissions.ts` | Permissões já mapeadas, sem mudança no auth |
| `ROLES_FINANCEIRO` constant | `permissions.ts` | Pronta para usar nos guards das novas rotas |
| Vercel Blob | `/api/upload` | Upload de comprovantes sem infra adicional |
| Recharts | `package.json` | Gráficos de fluxo de caixa sem nova dependência |
| `date-fns` | `package.json` | Cálculo de competência, vencimento, inadimplência |
| CSV utils | `src/lib/utils/csv.ts` | Exportação de relatórios |
| Toast (Sonner) | `providers.tsx` | Feedback de ações financeiras |
| TanStack Query | `package.json` | Cache e invalidação para listas de mensalidades |

### 2.2 Estado Atual do Banco e Infra (verificado)

| Item | Status | Detalhe |
|------|--------|---------|
| Tabelas existentes no Neon | 13 | `members`, `users`, `posts`, `comentarios`, `reacoes`, `comunicados`, `comunicado_destinatarios`, `presencas`, `loja_sessions`, `classificados`, `filhos`, `frases`, `_prisma_migrations` |
| Tamanho atual do banco | 9 MB | Limite free tier: **512 MB** — margem confortável |
| Limite de tabelas Neon | Sem limite | Neon não impõe limite de tabelas no free tier |
| Vercel Blob usado | Pouco (fotos de sessão + posts) | Limite free tier: **1 GB** — ok para comprovantes |
| Membros ativos | 52 | Base para gerar-lote: ~52 mensalidades/mês |
| Usuários cadastrados | 51 | 49 MEMBRO + 2 ADMIN; **nenhum FINANCEIRO** |
| Tesoureiro com acesso | ❌ Não existe | Criar antes de entrar em produção |
| Helder (admin) | `helder@ex2.com.br` / ADMIN | Tem `memberId` vinculado — pode testar o módulo |

### 2.3 Decisões de Design

**Cobrança mensal, valor e vencimento configuráveis**  
Definido: cobrança é **mensal**. Valor e dia de vencimento **não são hardcoded** — ficam em uma tabela de configuração (`ConfigLoja`) que o admin edita. Isso cobre variações futuras de valor, reajustes anuais e lojas com valores diferentes.

**Timeline de variações de mensalidade — casos suportados:**

| Caso | Como o modelo suporta |
|------|----------------------|
| Valor atualizado (reajuste) | Campo `valor` por registro; configuração global só afeta novas competências |
| Valor negociado individualmente | `valor` editável por mensalidade + `observacao` obrigatório |
| Acordo / parcelamento | `observacao` com termos + nova data em `vencimento` + status `PENDENTE` |
| Inadimplência admitida (acordo) | Status permanece `PENDENTE`, `observacao` registra o acordo |
| Desconto aplicado | Campo `desconto` deduz do `valorTotal` |
| Juros/multa por atraso | Campo `jurosMulta` adiciona ao `valorTotal` |
| Isenção formal | Campo `isento: true` + `status: CANCELADO` + `observacao` obrigatória |
| Membro novo (admissão no meio do mês) | Tesoureiro cria mensalidade manual com valor proporcional |

**Geração automática de mensalidades em lote**  
O Tesoureiro não cria 52 registros manualmente. Um clique gera para todos os ativos da competência. O unique constraint `[memberId, competencia]` garante idempotência — rodar duas vezes não duplica.

**Parâmetros configuráveis — model `ConfigLoja`**  
Chave PIX, valor padrão da mensalidade, dia de vencimento e outros parâmetros da Loja ficam em uma tabela de configuração (ver seção 3.4). Tudo editável pelo admin sem deploy.

**Sem gateway no MVP**  
Integração PIX/boleto (Asaas/Efí) exige conta PJ, compliance bancário e webhooks. O MVP entrega valor imediato sem ela: lançamento manual + link WhatsApp pré-formatado com chave PIX da ConfigLoja. Gateway entra na Fase 6.

**`Decimal` vs `Float` no Prisma**  
Valores monetários **sempre** `Decimal` (`NUMERIC` no PostgreSQL). Nunca `Float`. Na serialização JSON, converter com `parseFloat(value.toString())`.

**Regularidade como campo derivado**  
Não persistir `regular` no Member. Regularidade = presença OK + mensalidades em dia. Calcular on-demand — evita dados desatualizados.

### 2.4 Princípios de UX para o Módulo Financeiro

Toda interface construída neste módulo deve respeitar:

**1. Cada role vê exatamente o que precisa**
- `MEMBRO`: vê apenas sua própria situação financeira — sem valores de outros irmãos, sem listagem geral, sem ações de gestão. Acesso restrito à aba "Financeiro" no próprio perfil.
- `FINANCEIRO` (Tesoureiro): painel completo de gestão — lista de todos, geração de lote, baixa, acordos, caixa, relatórios. Sem acesso a gestão de usuários ou membros.
- `ADMIN`: tudo do Tesoureiro + configuração da Loja (`/admin/config`) + auditoria.

**2. Ações destrutivas pedem confirmação**
Baixa manual, isenção e cancelamento de mensalidade não são reversíveis facilmente. Sempre modal de confirmação com resumo do que será feito e campo de observação obrigatório para isenção/cancelamento.

**3. Status com linguagem clara e cores consistentes**

| Status | Cor | Label para o Membro | Label para o Tesoureiro |
|--------|-----|-------------------|------------------------|
| PENDENTE | Amarelo | "Em aberto" | "Pendente" |
| PAGO | Verde | "Pago ✓" | "Quitado" |
| VENCIDO | Vermelho | "Atrasado" | "Vencido" |
| CANCELADO | Cinza | (não exibir) | "Cancelado / Isento" |

**4. O Membro nunca se sente cobrado pelo sistema**
O banner de alerta no feed usa linguagem fraternal: "Você possui mensalidade em aberto. [Ver detalhes →]" — não "Você está inadimplente". O status no perfil exibe o valor e a forma de pagamento (chave PIX) sem tom de cobrança.

**5. Fluxo do Tesoureiro deve ser rápido**
A listagem de mensalidades é a tela principal. As ações mais comuns (baixa manual, link WhatsApp) ficam visíveis diretamente na linha da tabela — sem precisar abrir detalhe para operações rotineiras.

**6. Formulários com valores monetários**
Usar máscara de moeda brasileira (R$ 1.234,56). Campo numérico com `inputMode="decimal"`. Nunca deixar o usuário digitar vírgula/ponto sem validação — converter para `Decimal` antes de salvar.

### 2.5 Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|:------------:|-----------|
| Decimal no Neon HTTP causa serialização estranha | Média | Converter para `number` via `parseFloat()` nas API responses |
| Geração em lote de mensalidades → muitas queries paralelas | Média | Usar `Promise.all` com chunks de 10 por vez (não todos de uma vez) |
| Membro sem email cadastrado não recebe alertas | Alta | Alertas visuais no login são suficientes para MVP; email é Fase 3 |
| Tesoureiro lança competência errada | Baixa | Validação de formato `YYYY-MM` + confirmação antes de gerar lote |

---

## 3. Modelo de Dados

### 3.1 Novos Enums

```prisma
enum TransacaoTipo {
  RECEITA
  DESPESA
}

enum TransacaoStatus {
  PENDENTE   // Gerada, aguardando pagamento
  PAGO       // Confirmado (manual ou gateway)
  VENCIDO    // Passou do vencimento sem pagamento
  CANCELADO  // Anulada (erro de lançamento, isenção)
}

enum CategoriaFinanceira {
  MENSALIDADE          // Anuidade/mensalidade do membro
  TRONCO_SOLIDARIEDADE // Contribuição voluntária entre irmãos
  TAXA_GRAU            // Taxa de elevação/exaltação
  DOACAO               // Doação externa
  MANUTENCAO_TEMPLO    // Despesa com manutenção
  AGAPE                // Custo do ágape
  REPASSE_POTENCIA     // Repasse à Grande Loja
  OUTROS               // Qualquer outra categoria
}

enum GatewayTipo {
  MANUAL        // Lançamento manual pelo tesoureiro (padrão MVP)
  C6BANK        // C6 Bank — PIX gratuito, mTLS
  CORA          // Cora — banco digital PJ, CoraPro
  ASAAS         // Asaas — fintech de cobranças, recorrência nativa
  STRIPE        // Stripe — gateway global, melhor DX
  MERCADO_PAGO  // Mercado Pago — maior adoção no Brasil
}
```

### 3.2 Model Mensalidade

```prisma
model Mensalidade {
  id            String          @id @default(cuid())
  memberId      String
  member        Member          @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Competência no formato "YYYY-MM" (ex: "2026-07")
  // Para anuidade: "2026-01" = ano 2026
  competencia   String

  // Valores
  valor         Decimal         @db.Decimal(10, 2)  // Valor base
  desconto      Decimal?        @db.Decimal(10, 2)  // Desconto aplicado
  jurosMulta    Decimal?        @db.Decimal(10, 2)  // Juros/multa por atraso
  valorTotal    Decimal         @db.Decimal(10, 2)  // Valor efetivamente pago/devido

  // Datas
  vencimento    DateTime
  pagamento     DateTime?       // null = não pago ainda

  // Status
  status        TransacaoStatus @default(PENDENTE)
  isento        Boolean         @default(false)      // Isenção formal (viúvo, enfermo, etc.)
  observacao    String?         @db.Text             // Acordo, parcelamento, justificativa

  // Gateway (Fase 5)
  gateway       GatewayTipo     @default(MANUAL)
  externalId    String?
  pixQrCode     String?         @db.Text
  pixCopiaECola String?         @db.Text
  boletoUrl     String?

  // Auditoria
  registradoPorId String?       // userId de quem lançou
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([memberId, competencia])  // Um registro por membro por competência
  @@index([memberId])
  @@index([competencia])
  @@index([status])
  @@map("mensalidades")
}
```

### 3.3 Model TransacaoCaixa

```prisma
model TransacaoCaixa {
  id             String              @id @default(cuid())
  tipo           TransacaoTipo       // RECEITA ou DESPESA
  categoria      CategoriaFinanceira
  descricao      String
  valor          Decimal             @db.Decimal(10, 2)
  data           DateTime            @default(now())

  // Vínculo opcional com membro (ex: taxa de grau)
  memberId       String?
  member         Member?             @relation(fields: [memberId], references: [id], onDelete: SetNull)

  // Quem registrou (obrigatório para auditoria)
  registradoPorId String
  comprovanteUrl  String?            // Upload Vercel Blob (nota fiscal, recibo)

  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  @@index([tipo])
  @@index([categoria])
  @@index([data])
  @@map("transacoes_caixa")
}
```

### 3.4 Model ConfigLoja (novo — parâmetros globais configuráveis)

```prisma
model ConfigLoja {
  id                    String   @id @default("singleton") // Sempre 1 registro
  nome                  String   @default("Loja Maçônica")

  // Financeiro
  mensalidadeValorPadrao Decimal  @db.Decimal(10, 2) @default(0)
  mensalidadeDiaVencimento Int   @default(10)   // Dia do mês (1–28)
  pixChave              String?  // Chave PIX para exibir nos alertas/links
  pixTipo               String?  // cpf | cnpj | email | telefone | aleatoria
  pixBeneficiario       String?  // Nome para exibir junto à chave

  // Contato / Institucional
  cnpj                  String?
  email                 String?
  telefone              String?
  endereco              String?

  updatedAt             DateTime @updatedAt
  @@map("config_loja")
}
```

> **Por que `@id @default("singleton")`?**  
> Garante que existe exatamente 1 linha. O `upsert` no update sempre encontra ou cria o mesmo registro. Sem necessidade de paginação, sem FK, sem complexidade.

### 3.5 Relações a Adicionar nos Models Existentes

```prisma
// Em Member — adicionar:
mensalidades      Mensalidade[]
transacoesCaixa   TransacaoCaixa[]

// Em User — NÃO adicionar relação (usar registradoPorId como String simples)
// Evita complexity desnecessária no MVP
```

---

## 4. API Routes

### Mensalidades

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/financeiro/mensalidades` | ADMIN, FINANCEIRO | Lista mensalidades com filtros |
| POST | `/api/financeiro/mensalidades` | ADMIN, FINANCEIRO | Cria mensalidade individual |
| POST | `/api/financeiro/mensalidades/gerar-lote` | ADMIN, FINANCEIRO | Gera mensalidades para todos os membros ativos de uma competência |
| GET | `/api/financeiro/mensalidades/[id]` | ADMIN, FINANCEIRO | Detalhe |
| PATCH | `/api/financeiro/mensalidades/[id]` | ADMIN, FINANCEIRO | Baixa, acordo, isenção |
| DELETE | `/api/financeiro/mensalidades/[id]` | ADMIN | Cancela (soft via status CANCELADO) |
| GET | `/api/financeiro/mensalidades/membro/[memberId]` | ADMIN, FINANCEIRO, MEMBRO (próprio) | Histórico financeiro do membro |

### Caixa

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/financeiro/caixa` | ADMIN, FINANCEIRO | Lista transações com filtros |
| POST | `/api/financeiro/caixa` | ADMIN, FINANCEIRO | Registra receita ou despesa |
| GET | `/api/financeiro/caixa/[id]` | ADMIN, FINANCEIRO | Detalhe |
| DELETE | `/api/financeiro/caixa/[id]` | ADMIN | Remove lançamento |

### Dashboard e Relatórios

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/financeiro/dashboard` | ADMIN, FINANCEIRO | KPIs: total arrecadado, inadimplência, saldo |
| GET | `/api/financeiro/relatorio` | ADMIN, FINANCEIRO | Balancete por período (CSV ou JSON) |
| GET | `/api/financeiro/inadimplentes` | ADMIN, FINANCEIRO | Lista de membros com mensalidades vencidas |

### Configuração

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/financeiro/config` | ADMIN, FINANCEIRO | Lê ConfigLoja (inclui chave PIX, valor padrão) |
| GET | `/api/admin/config` | ADMIN | Lê ConfigLoja completa |
| PUT | `/api/admin/config` | ADMIN | Salva ConfigLoja (upsert singleton) |

---

## 5. Telas (UI)

### 5.1 Painel do Tesoureiro — `/financeiro`

Aba **Mensalidades:**
- Tabela: Membro | Competência | Valor | Vencimento | Status (badge colorido) | Ações
- Filtros: competência (mês/ano), status, busca por nome
- Botão "Gerar lote" (abre modal: competência + valor + vencimento → gera para todos ativos)
- Botão "Baixa" por linha → modal: data pagamento, valor recebido, observação
- Botão "Acordo" → modal: observação obrigatória + novo vencimento
- Botão "Isentar" → modal: justificativa obrigatória
- Botão "WhatsApp" → link `wa.me/55NUMERO?text=...` pré-formatado com nome, valor e dados de pagamento

Aba **Caixa:**
- Tabela: Data | Tipo (RECEITA/DESPESA) | Categoria | Descrição | Membro (se vinculado) | Valor
- Filtro por tipo, categoria, período
- Botão "Novo lançamento" → formulário: tipo, categoria, valor, data, descrição, membro (opcional), upload comprovante

Aba **Dashboard:**
- Card: Total arrecadado no mês
- Card: Total pendente (em aberto)
- Card: Taxa de inadimplência (%)
- Card: Saldo de caixa (receitas − despesas no período)
- Gráfico de barras: Receitas vs. Despesas por mês (últimos 6 meses)
- Tabela: Top inadimplentes (nome + valor + tempo de atraso)

Aba **Relatório:**
- Seletor de período (de/até)
- Tabela de balancete com totais por categoria
- Botão exportar CSV

### 5.2 Painel do Membro — sub-aba em `/perfil`

Nova aba "Financeiro" na página de perfil (visível apenas para MEMBRO logado):
- Status geral: "Em dia ✅" ou "Pendências ⚠️ R$ XXX"
- Tabela: Competência | Vencimento | Valor | Status
- Link "Pagar via PIX" (exibe chave PIX da loja, ou futuramente QR Code)
- Banner de alerta no topo da página de perfil quando há vencido

### 5.3 Banner de Alerta no Feed

Quando MEMBRO logado tem mensalidade VENCIDA:
```
⚠️  Você possui mensalidade(s) vencida(s). Regularize para manter sua regularidade.
    [Ver minha situação →]
```
Exibir uma vez por sessão (localStorage). Não bloquear acesso.

---

## 6. Plano de Implementação

> Cada fase termina com um **Roteiro de Testes** que cobre funcionalidade, usabilidade e controle de acesso por role. Execute o roteiro completo antes de considerar a fase concluída.

---

### Fase 1 — Fundação (1–2 dias)
**Objetivo:** Banco pronto, permissões atualizadas, configuração da Loja funcional. Nenhuma UI de mensalidade ainda.

**Implementação:**
- [ ] Adicionar enums e models ao `prisma/schema.prisma`:
  - `TransacaoTipo`, `TransacaoStatus`, `CategoriaFinanceira`, `GatewayTipo`
  - `Mensalidade`, `TransacaoCaixa`, `ConfigLoja`
  - Relações `mensalidades[]` e `transacoesCaixa[]` no model `Member`
- [ ] Executar migration: `npx prisma migrate dev --name add_modulo_financeiro`
- [ ] Seed da `ConfigLoja` com valores iniciais:
  ```sql
  INSERT INTO config_loja (id, nome, "mensalidadeValorPadrao", "mensalidadeDiaVencimento", "updatedAt")
  VALUES ('singleton', 'Loja Itapetinga', 0, 10, NOW())
  ON CONFLICT (id) DO NOTHING;
  ```
- [ ] Criar `GET/PUT /api/admin/config` (roles: ADMIN)
- [ ] Criar `GET /api/financeiro/config` (roles: ADMIN, FINANCEIRO)
- [ ] Atualizar `src/lib/permissions.ts` com `ROLES_FINANCEIRO = ["ADMIN", "FINANCEIRO"]`
- [ ] Adicionar item "Financeiro" na sidebar (ícone `Wallet`, roles: ADMIN, FINANCEIRO)
- [ ] Criar `src/app/(dashboard)/financeiro/page.tsx` — placeholder com abas (Mensalidades, Caixa, Dashboard, Relatório)
- [ ] Criar `src/app/(dashboard)/admin/config/page.tsx` — formulário: nome da loja, valor padrão, dia vencimento, chave PIX (tipo + valor + beneficiário)

---

**Roteiro de Testes — Fase 1**

**T1.1 — Controle de acesso à sidebar**
1. Login como `admin@loja.com` (ADMIN) → sidebar deve exibir item "Financeiro"
2. Login como membro qualquer (MEMBRO) → sidebar **não** deve exibir "Financeiro"
3. *(Após criar conta FINANCEIRO)* Login como tesoureiro → sidebar deve exibir "Financeiro"

**T1.2 — Configuração da Loja**
1. Login como ADMIN → acessar `/admin/config`
2. Preencher: Valor padrão R$ 80,00 · Dia de vencimento: 10 · Chave PIX: email · `financeiro@lojaitapetinga.com.br` · Beneficiário: Loja Itapetinga
3. Clicar "Salvar" → deve aparecer toast de sucesso
4. Recarregar a página → todos os campos devem manter os valores salvos
5. Alterar apenas o dia de vencimento para 15 → salvar → recarregar → confirmar que só o dia mudou

**T1.3 — Proteção de rota de configuração**
1. Tentar acessar `/admin/config` com login de MEMBRO → deve redirecionar ou retornar 403
2. Tentar `PUT /api/admin/config` com token de FINANCEIRO → deve retornar 403 (configuração é só ADMIN)
3. `GET /api/financeiro/config` com token de FINANCEIRO → deve retornar os dados (sem campos sensíveis desnecessários)

**T1.4 — Placeholder da página `/financeiro`**
1. Login como ADMIN → acessar `/financeiro` → deve carregar sem erro
2. Abas visíveis: Mensalidades, Caixa, Dashboard, Relatório (podem estar vazias/em construção)

---

### Fase 2 — Mensalidades (3–4 dias)
**Objetivo:** Tesoureiro cria, visualiza, baixa, registra acordos e isenta mensalidades.

**Implementação:**
- [ ] `POST /api/financeiro/mensalidades` — criar individual
- [ ] `POST /api/financeiro/mensalidades/gerar-lote` — gerar para todos os ativos em chunks de 10:
  ```typescript
  const chunks = chunk(membrosAtivos, 10)
  for (const batch of chunks) {
    await Promise.all(
      batch.map(m =>
        prisma.mensalidade.create({
          data: { memberId: m.id, competencia, valor, valorTotal: valor, vencimento, status: "PENDENTE", registradoPorId: user.id }
        }).catch(() => null) // ignora unique constraint (já existe para essa competência)
      )
    )
  }
  ```
- [ ] `GET /api/financeiro/mensalidades` — listar com filtros: `status`, `competencia`, `busca` (nome do membro)
- [ ] `PATCH /api/financeiro/mensalidades/[id]` — ações: `baixa` | `acordo` | `isentar` | `cancelar`
- [ ] Tela `/financeiro` aba Mensalidades:
  - Tabela com colunas: Membro | Competência | Valor | Vencimento | Status (badge) | Ações
  - Filtros no topo: seletor de competência (mês/ano) + filtro de status + busca por nome
  - Botão "Gerar lote" → modal de confirmação com campos: competência, valor, vencimento; exibe "Será gerado para X membros ativos"
  - Por linha: botão "Baixa" (ícone check) + botão "WhatsApp" (ícone phone) + menu "..." com Acordo / Isentar / Cancelar
  - Modal Baixa: data de pagamento (default hoje) + valor recebido (default valorTotal) + observação opcional
  - Modal Acordo: novo vencimento + observação obrigatória
  - Modal Isentar: justificativa obrigatória + confirmação dupla ("Confirmo que este irmão está formalmente isento")
- [ ] Link WhatsApp gerado com `ConfigLoja.pixChave`:
  ```typescript
  const msg = encodeURIComponent(
    `Olá Ir. ${nome}, sua mensalidade referente a ${competenciaLabel} no valor de R$ ${valorTotal} venceu em ${format(vencimento, 'dd/MM/yyyy')}.\n` +
    `Para regularizar, utilize a chave PIX: ${config.pixChave} (${config.pixBeneficiario}).`
  )
  window.open(`https://wa.me/55${telefone}?text=${msg}`, '_blank')
  ```

---

**Roteiro de Testes — Fase 2**

**T2.1 — Gerar lote (caminho feliz)**
1. Login como ADMIN → `/financeiro` aba Mensalidades
2. Clicar "Gerar lote" → modal abre com competência pré-preenchida (mês atual), valor do ConfigLoja, dia de vencimento do ConfigLoja
3. Confirmar → toast "52 mensalidades geradas" (ou o número de ativos)
4. Tabela carrega com todos os membros, status PENDENTE, valor correto
5. Clicar "Gerar lote" novamente para o **mesmo mês** → modal deve avisar "já existem X mensalidades para essa competência" → ao confirmar, não duplica registros

**T2.2 — Gerar lote com valor diferente**
1. Gerar lote para outro mês (ex: 2026-09) com valor personalizado R$ 90,00
2. Verificar que as novas mensalidades têm R$ 90,00 e as anteriores mantêm R$ 80,00

**T2.3 — Baixa manual**
1. Localizar um membro na tabela (usar filtro por nome)
2. Clicar "Baixa" → modal abre com data hoje e valor correto
3. Alterar data para ontem → salvar → status muda para PAGO (badge verde)
4. Tentar dar baixa novamente no mesmo registro → botão deve estar desabilitado ou modal deve impedir

**T2.4 — Acordo / novo vencimento**
1. Clicar "..." → "Acordo" em um registro PENDENTE
2. Tentar salvar sem preencher observação → deve bloquear com mensagem de validação
3. Preencher observação + nova data de vencimento → salvar → observação e nova data aparecem no detalhe
4. Status permanece PENDENTE; vencimento atualizado

**T2.5 — Isenção**
1. Clicar "..." → "Isentar" em um registro PENDENTE
2. Tentar salvar sem justificativa → bloqueado
3. Preencher justificativa → checkbox de confirmação → salvar → status vira CANCELADO, badge cinza
4. Registro permanece visível na listagem (não some — auditoria)

**T2.6 — Link WhatsApp**
1. Clicar no ícone de WhatsApp em um registro de membro com telefone cadastrado
2. Deve abrir nova aba/janela com `wa.me/55NUMERO?text=...`
3. Verificar o texto: contém nome do irmão, valor, mês, chave PIX configurada
4. Clicar em membro **sem telefone** → deve exibir toast "Este irmão não tem telefone cadastrado"

**T2.7 — Filtros e busca**
1. Filtrar por status "PAGO" → só aparecem os baixados
2. Buscar por nome parcial (ex: "Silva") → filtra corretamente
3. Trocar competência → tabela recarrega para o mês selecionado

**T2.8 — Controle de acesso**
1. Tentar `PATCH /api/financeiro/mensalidades/[id]` com token de MEMBRO → 403
2. Tentar `DELETE` (cancelar) com token de FINANCEIRO → 403 (só ADMIN pode cancelar)
3. Com ADMIN: cancelar funciona

---

### Fase 3 — Caixa (1–2 dias)
**Objetivo:** Tesoureiro registra receitas e despesas avulsas do templo com comprovante.

**Implementação:**
- [ ] `POST /api/financeiro/caixa` — criar transação (com upload de comprovante via `/api/upload`)
- [ ] `GET /api/financeiro/caixa` — listar com filtros: tipo, categoria, período, busca
- [ ] `DELETE /api/financeiro/caixa/[id]` — remover (roles: ADMIN only)
- [ ] Tela `/financeiro` aba Caixa:
  - Tabela: Data | Tipo (badge RECEITA verde / DESPESA vermelho) | Categoria | Descrição | Membro (se vinculado) | Valor | Comprovante (ícone de link)
  - Filtros: período (de/até), tipo, categoria
  - Resumo no topo: Receitas totais | Despesas totais | Saldo do período
  - Botão "Novo lançamento" → painel lateral (sheet) com formulário:
    - Tipo: RECEITA / DESPESA (toggle, destaca a cor)
    - Categoria (select com opções do enum)
    - Descrição (obrigatório)
    - Valor (máscara R$, obrigatório)
    - Data (default hoje)
    - Membro vinculado (opcional, autocomplete)
    - Upload de comprovante (opcional, imagem ou PDF)

---

**Roteiro de Testes — Fase 3**

**T3.1 — Registrar receita (Tronco de Solidariedade)**
1. Login como ADMIN → `/financeiro` aba Caixa
2. Clicar "Novo lançamento"
3. Selecionar RECEITA · Categoria: Tronco de Solidariedade · Descrição: "Coleta sessão ordinária julho" · Valor: R$ 450,00 · Data: hoje
4. Salvar → aparece na listagem com badge verde "RECEITA"
5. Resumo do topo atualiza: Receitas aumenta R$ 450,00

**T3.2 — Registrar despesa com comprovante**
1. Novo lançamento → DESPESA · Categoria: Manutenção do Templo · Descrição: "Lâmpadas sala de sessão" · Valor: R$ 87,50
2. Fazer upload de foto da nota fiscal (JPG, < 5 MB)
3. Salvar → linha exibe ícone de comprovante clicável → clicar deve abrir a imagem em nova aba
4. Saldo do período deve ser Receitas − Despesas correto

**T3.3 — Vincular lançamento a um membro (taxa de grau)**
1. Novo lançamento → RECEITA · Categoria: Taxa de Grau · Vincular membro (autocomplete por nome) · Valor: R$ 200,00
2. Salvar → coluna "Membro" exibe o nome vinculado
3. No futuro, ao ver o histórico desse membro, o lançamento deve aparecer associado

**T3.4 — Filtros de caixa**
1. Filtrar por tipo DESPESA → só despesas aparecem; resumo do topo mostra só despesas
2. Filtrar por período (01/07 a 31/07) → só lançamentos do mês
3. Filtrar por categoria "Manutenção" → filtra corretamente

**T3.5 — Remoção (só ADMIN)**
1. Login como FINANCEIRO → botão de remover lançamento não aparece
2. Login como ADMIN → botão de remover visível → clicar → modal de confirmação → confirmar → lançamento some e saldo é recalculado
3. Tentar `DELETE /api/financeiro/caixa/[id]` com token FINANCEIRO → 403

---

### Fase 4 — Dashboard e Relatórios (2–3 dias)
**Objetivo:** Visibilidade executiva para Sessão Econômica — KPIs, gráficos e exportação.

**Implementação:**
- [ ] `GET /api/financeiro/dashboard` — KPIs e série histórica:
  ```typescript
  const [arrecadado, pendente, despesas, inadimplentes] = await Promise.all([
    prisma.mensalidade.aggregate({ where: { status: "PAGO" }, _sum: { valorTotal: true } }),
    prisma.mensalidade.aggregate({ where: { status: { in: ["PENDENTE", "VENCIDO"] } }, _sum: { valorTotal: true } }),
    prisma.transacaoCaixa.aggregate({ where: { tipo: "DESPESA" }, _sum: { valor: true } }),
    prisma.mensalidade.count({ where: { status: "VENCIDO" } }),
  ])
  ```
- [ ] `GET /api/financeiro/relatorio?de=2026-01&ate=2026-07` — balancete por período
- [ ] `GET /api/financeiro/inadimplentes` — lista membros com VENCIDO
- [ ] Tela aba Dashboard:
  - 4 cards: Arrecadado no mês | Pendente/Em aberto | Saldo de caixa | Taxa de inadimplência (%)
  - Gráfico de barras agrupadas (Recharts): Receitas vs. Despesas por mês, últimos 6 meses
  - Tabela "Inadimplentes": Nome | Meses em atraso | Total em aberto | Ação (link WhatsApp)
- [ ] Tela aba Relatório:
  - Seletor de/até (mês/ano)
  - Tabela balancete: Categoria | Receitas | Despesas | Saldo
  - Total geral no rodapé
  - Botão "Exportar CSV" → gera arquivo com todos os lançamentos do período

---

**Roteiro de Testes — Fase 4**

**T4.1 — Cards do Dashboard**
1. Login como ADMIN → `/financeiro` aba Dashboard
2. Card "Arrecadado no mês" deve bater com a soma de mensalidades PAGO do mês atual
3. Card "Pendente" deve bater com soma de PENDENTE + VENCIDO
4. Card "Taxa de inadimplência" = (membros com VENCIDO / total de membros ativos) × 100, exibido como %
5. Saldo de caixa = total RECEITA − total DESPESA (do mês atual)

**T4.2 — Coerência dos dados (cruzamento com Fases 2 e 3)**
1. Anotar: quantos pagamentos foram dados na Fase 2, soma dos valores
2. No Dashboard, "Arrecadado" deve refletir exatamente essa soma
3. Registrar uma nova despesa (Fase 3) → saldo do Dashboard reduz imediatamente após refresh

**T4.3 — Gráfico histórico**
1. Gráfico exibe barras para os últimos 6 meses (mesmo que com zero)
2. Mês com lançamentos tem barras proporcionais aos valores
3. Tooltip ao passar o mouse exibe os valores exatos
4. Sem dados históricos → estado vazio elegante, não erro JS

**T4.4 — Tabela de inadimplentes**
1. Membros com mensalidade VENCIDA aparecem na tabela
2. Coluna "Meses em atraso" conta quantas competências estão vencidas
3. Link WhatsApp na tabela usa o telefone do membro — clicar abre wa.me
4. Membro sem telefone: botão desabilitado com tooltip "Sem telefone cadastrado"

**T4.5 — Relatório e exportação**
1. Selecionar período Jan–Jul 2026 → tabela balancete carrega com categorias e totais
2. Total de receitas + total de despesas = saldo correto
3. Clicar "Exportar CSV" → arquivo baixado com nome `balancete-2026-01-2026-07.csv`
4. Abrir CSV: contém colunas esperadas, valores com ponto decimal (não vírgula), sem caracteres estranhos
5. Período sem dados → tabela vazia com mensagem "Nenhum lançamento no período"

**T4.6 — Acesso por role**
1. Login como FINANCEIRO → Dashboard visível e funcional
2. Login como MEMBRO → `/financeiro` deve retornar 403 ou redirect
3. Login como SECRETARIO → `/financeiro` não aparece na sidebar, URL direta retorna 403

---

### Fase 5 — Visão do Membro (1–2 dias)
**Objetivo:** Membro acompanha sua situação financeira sem depender do tesoureiro. Sem constrangimento.

**Implementação:**
- [ ] `GET /api/financeiro/mensalidades/membro/[memberId]` — histórico do membro
  - Guard: MEMBRO só acessa o próprio `memberId`; ADMIN e FINANCEIRO acessam qualquer um
  - Lazy update: se `vencimento < hoje && status === PENDENTE` → atualizar para VENCIDO antes de retornar
- [ ] Aba "Financeiro" na página `/perfil`:
  - Visível apenas para o próprio membro (não para admin visualizando perfil alheio)
  - Status geral: badge "Em dia" (verde) ou "Pendências — R$ XX,XX" (amarelo/vermelho)
  - Tabela: Mês/Ano | Vencimento | Valor | Status (badge) — sem colunas de gestão
  - Seção "Como pagar": exibe tipo e chave PIX da ConfigLoja, nome do beneficiário, instrução simples
  - **Sem botões de ação** — o membro não pode editar nada, só visualizar
- [ ] Banner no feed (componente reutilizável):
  - Verificar na query do feed se o membro tem VENCIDO
  - Exibir banner amarelo no topo: "Você tem mensalidade(s) em aberto. [Ver minha situação →]"
  - Dismissível (salvar em `sessionStorage` — volta ao recarregar a aba, some na sessão)
  - Linguagem fraternal, sem tom de cobrança

---

**Roteiro de Testes — Fase 5**

**T5.1 — Aba Financeiro no perfil (membro em dia)**
1. Login como membro com todas as mensalidades PAGO
2. Acessar `/perfil` aba "Financeiro"
3. Status geral: badge verde "Em dia"
4. Tabela lista histórico de pagamentos com status PAGO
5. Seção "Como pagar" exibe a chave PIX configurada

**T5.2 — Aba Financeiro no perfil (membro com pendência)**
1. Login como membro com mensalidade VENCIDA (criar via admin na Fase 2 se necessário)
2. Badge vermelho/amarelo "Pendências — R$ 80,00"
3. Mensalidade vencida aparece com badge vermelho "Atrasado" (não "VENCIDO" — linguagem amigável)
4. A linha mostra o valor e o vencimento original

**T5.3 — Banner no feed**
1. Login como membro com mensalidade VENCIDA → acessar `/feed`
2. Banner amarelo aparece no topo da lista de posts: "Você tem mensalidade(s) em aberto. [Ver minha situação →]"
3. Clicar no link → navega para `/perfil` abrindo a aba "Financeiro"
4. Fechar/dispensar o banner → some da tela
5. Navegar para outra página e voltar ao feed na **mesma sessão** → banner não reaparece
6. Abrir nova aba ou recarregar (nova sessão) → banner reaparece

**T5.4 — Membro em dia não vê banner**
1. Login como membro com todas PAGO → `/feed` → nenhum banner

**T5.5 — Isolamento de dados**
1. Login como membro A → `/perfil` aba Financeiro → vê apenas as próprias mensalidades
2. Tentar `GET /api/financeiro/mensalidades/membro/[id_de_outro_membro]` com token do membro A → 403
3. Login como FINANCEIRO → pode acessar o histórico de qualquer membro via API

**T5.6 — Usabilidade — sem ações de gestão**
1. Login como MEMBRO → aba Financeiro → não deve aparecer botão "Baixa", "Acordo", "Isentar", "Cancelar"
2. Tela é somente leitura: tabela e informação de pagamento

---

### Fase 6 — Gateway PIX (futuro, Q1 2027)
**Objetivo:** Cobrança automática — QR Code gerado na criação, status atualizado via webhook.

#### 6.1 Gateways Previstos (parametrizados)

O sistema prevê integração com **5 gateways**, selecionável via `ConfigLoja` sem mudança de código. Todos suportam PIX, webhook e têm API REST.

| Gateway | Tipo | PIX | Boleto | Sandbox | Auth | Destaque |
|---------|------|-----|--------|---------|------|---------|
| **C6 Bank** | Banco digital PJ | Gratuito | Disponível | ✅ | Certificado mTLS | PIX sem custo; conta corrente PJ inclusa |
| **Cora** | Banco digital PJ | Gratuito | R$0,50 (PIX QR) / R$1,70 (barcode) | ⚠️ Limitado | REST padrão | Plano CoraPro R$44,90/mês; foco em PJ pequeno |
| **Asaas** | Fintech de cobranças | R$0,99–1,99/tx | R$0,99–1,99/tx | ✅ | API Key | Cobrança recorrente nativa; melhor documentação |
| **Stripe** | Gateway global | Variável | Não nativo BR | ✅ | API Key | Melhor DX; overkill para uso doméstico |
| **Mercado Pago** | Gateway BR/LATAM | 0,99% | Variável | ✅ | OAuth / API Key | Maior adoção; membros já conhecem a marca |

**Notas importantes por gateway:**

- **C6 Bank** — autenticação via certificado mTLS (mais complexo de configurar, mas custo zero no PIX). Requer conta corrente PJ aberta no C6. API em `developers.c6bank.com.br`.
- **Cora** — banco digital focado em MEI/ME/LTDA. PIX gratuito, boleto barato. Plano CoraPro R$44,90/mês inclui a conta e a API. Sandbox com informação limitada — validar disponibilidade antes de escolher.
- **Asaas** — fintech de cobranças (não é banco). Mais fácil de aprovar para associações. Cobrança recorrente nativa elimina o cron de gerar lote mensal.
- **Stripe** — melhor experiência de desenvolvimento, documentação superior, sandbox robusto. PIX suportado no Brasil mas sem boleto nativo — adequado se no futuro o sistema aceitar cartão internacional.
- **Mercado Pago** — amplamente conhecido pelos membros (podem ter a conta); OAuth facilita integração. Taxa de 0,99% no PIX.

**Recomendação para a Loja Itapetinga (por prioridade):**
1. **C6 Bank ou Cora** — bancos digitais PJ com PIX gratuito. Se a Loja abrir conta corrente num deles, o custo de cobrança é zero.
2. **Asaas** — se a Loja não quiser abrir conta bancária nova; mais simples de aprovar, cobrança recorrente nativa.
3. **Mercado Pago** — alternativa conhecida, sem necessidade de conta nova para a Loja.
4. **Stripe** — apenas se surgir necessidade de pagamento internacional.

> **Decisão pendente:** qual gateway ativar primeiro? Todos exigem CNPJ da Loja + documentação básica (estatuto, ata de eleição). O gateway selecionado fica em `ConfigLoja.gateway` e pode ser trocado sem deploy.

#### 6.2 Arquitetura — Adapter Pattern

O gateway é completamente isolado do resto do sistema. Trocar de C6 para Asaas é só mudar `ConfigLoja.gateway` e as credenciais — zero linha de código alterada fora de `src/lib/services/payment/`.

```
src/lib/services/payment/
  index.ts           # ponto de entrada: getAdapter() + gerarCobranca(), cancelar(), getStatus()
  types.ts           # interfaces GatewayAdapter, CobrancaInput, CobrancaOutput
  adapters/
    c6bank.ts        # C6 Bank (mTLS + PIX gratuito)
    cora.ts          # Cora (CoraPro API)
    asaas.ts         # Asaas (API Key, recorrência nativa)
    stripe.ts        # Stripe (SDK oficial)
    mercadopago.ts   # Mercado Pago (SDK oficial)
```

```typescript
// src/lib/services/payment/types.ts
export interface GatewayAdapter {
  gerarCobranca(input: CobrancaInput): Promise<CobrancaOutput>
  cancelar(externalId: string): Promise<void>
  verificarStatus(externalId: string): Promise<TransacaoStatus>
  validarWebhook(payload: unknown, signature: string): boolean
}

export type CobrancaInput = {
  valor: number             // em reais (ex: 80.00)
  vencimento: Date
  descricao: string
  referencia: string        // ex: "mensalidade-2026-07-MEMBERID"
  pagador: {
    nome: string
    cpf?: string
    email?: string
    telefone?: string
  }
}

export type CobrancaOutput = {
  externalId: string        // ID no gateway para referência futura
  pixQrCode?: string        // base64 da imagem do QR Code
  pixCopiaECola?: string    // string para copia-e-cola
  boletoUrl?: string        // link do boleto (se gerado)
  boletoCodigoBarras?: string
  status: TransacaoStatus
  expiresAt?: Date
}
```

```typescript
// src/lib/services/payment/index.ts
import { C6BankAdapter }     from "./adapters/c6bank"
import { CoraAdapter }       from "./adapters/cora"
import { AsaasAdapter }      from "./adapters/asaas"
import { StripeAdapter }     from "./adapters/stripe"
import { MercadoPagoAdapter} from "./adapters/mercadopago"

const ADAPTERS: Record<string, () => GatewayAdapter> = {
  c6bank:      () => new C6BankAdapter(),
  cora:        () => new CoraAdapter(),
  asaas:       () => new AsaasAdapter(),
  stripe:      () => new StripeAdapter(),
  mercadopago: () => new MercadoPagoAdapter(),
}

export function getAdapter(gateway?: string): GatewayAdapter {
  const key = gateway ?? process.env.PAYMENT_GATEWAY ?? "manual"
  if (key === "manual") throw new Error("Nenhum gateway configurado")
  const factory = ADAPTERS[key]
  if (!factory) throw new Error(`Gateway não suportado: ${key}`)
  return factory()
}
```

**Variáveis de ambiente — uma por gateway (só as do gateway ativo precisam ser preenchidas):**
```env
PAYMENT_GATEWAY=asaas        # c6bank | cora | asaas | stripe | mercadopago

# C6 Bank (mTLS)
C6_CLIENT_ID=...
C6_CERTIFICATE_PATH=...      # caminho do certificado .p12
C6_CERTIFICATE_PASS=...
C6_SANDBOX=true

# Cora
CORA_CLIENT_ID=...
CORA_CLIENT_SECRET=...
CORA_SANDBOX=true

# Asaas
ASAAS_API_KEY=...
ASAAS_SANDBOX=true           # true = sandbox, false = produção

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...    # para validar assinatura do webhook

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
```

> **Nota de segurança:** as credenciais do gateway ficam **somente** nas variáveis de ambiente (Vercel env vars), nunca no banco. Diferente das credenciais SMTP que o admin configura via UI, as credenciais bancárias são mais sensíveis e exigem processo de onboarding formal — não faz sentido expô-las em tela.

export const payment = getAdapter()
```

**Variáveis de ambiente por gateway:**
```env
PAYMENT_GATEWAY=efi          # qual adapter usar

# Efí
EFI_CLIENT_ID=...
EFI_CLIENT_SECRET=...
EFI_SANDBOX=true             # false em produção

# AbacatePay
ABACATEPAY_API_KEY=...

# Asaas
ASAAS_API_KEY=...
ASAAS_SANDBOX=true

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=...
```

#### 6.3 Implementação

- [ ] Decidir gateway e abrir conta (sandbox primeiro)
- [ ] Implementar adapter do gateway escolhido em `src/lib/services/payment/adapters/`
- [ ] Ao criar mensalidade: chamar `payment.gerarCobranca()` → salvar `pixQrCode`, `pixCopiaECola`, `externalId`
- [ ] `POST /api/webhooks/pagamentos/route.ts` — validar assinatura do gateway → atualizar `status: PAGO`, `pagamento: new Date()`
- [ ] Tela do membro: QR Code (imagem) + botão "Copiar código PIX"
- [ ] Tela do tesoureiro: badge indicando mensalidades com cobrança ativa no gateway
- [ ] Fallback: se gateway falhar na criação → mensalidade criada com `gateway: MANUAL`, sem QR Code, sem bloquear o fluxo

---

**Roteiro de Testes — Fase 6**

**T6.1 — Geração de QR Code (sandbox)**
1. Criar mensalidade em ambiente de teste com gateway Asaas sandbox
2. Mensalidade gerada contém `pixQrCode` (base64) e `pixCopiaECola` (string)
3. Tela do membro: imagem do QR Code renderiza + botão "Copiar" copia a string
4. Escanear QR Code com app de banco em sandbox → pagamento processado

**T6.2 — Webhook de confirmação**
1. Simular evento de pagamento confirmado (payload Asaas)
2. `POST /api/webhooks/pagamentos` → status atualiza para PAGO, data de pagamento preenchida
3. Dashboard e aba do membro refletem o novo status

**T6.3 — Fallback manual**
1. Gateway offline (simular erro de rede) → mensalidade criada com `gateway: MANUAL`, sem QR Code
2. Tesoureiro consegue dar baixa manual normalmente
3. Nenhum erro visível para o membro — tela do membro exibe chave PIX de texto como fallback

---

## 7. Sugestões e Melhorias em Relação à Spec Original

### 7.1 Adições Importantes

**`@@unique([memberId, competencia])` no Mensalidade**  
A spec original não tinha este constraint. Sem ele, é possível criar duplicatas. Com ele, o `create().catch()` no gerar-lote ignora membros que já têm mensalidade naquela competência — idempotente.

**`registradoPorId` em Mensalidade e TransacaoCaixa**  
Auditoria básica sem custo: saber quem lançou. Crítico para um módulo financeiro.

**Vencimento automático (lazy update)**  
Em vez de um cron job (complexidade de infra), marcar como VENCIDO na query GET quando `vencimento < now() && status === PENDENTE`. Simples e eficaz para o volume de uma Loja.

**Chunks no gerar-lote**  
Com 50+ membros, 50 creates em paralelo pode sobrecarregar o Neon free tier. Processar em chunks de 10.

### 7.2 O que a Spec Original Tinha Bem

- **Gateway como Fase 5** — correto. Não bloquear o valor imediato do módulo por uma dependência externa
- **Link WhatsApp pré-formatado** — solução elegante e zero-custo para notificação
- **`observacaoAcordo`** — fundamental para a realidade das Lojas brasileiras
- **Campo `isento`** — necessário para viúvos, enfermos, membros honorários

### 7.3 O que Não Fazer

- **Não criar um `status` financeiro no model Member** — é dado derivado, não persistido
- **Não usar `createMany` com `skipDuplicates`** — dispara transação no Neon HTTP
- **Não usar `Float` para valores monetários** — sempre `Decimal`
- **Não bloquear acesso ao sistema por inadimplência no MVP** — apenas alertar

---

## 8. Estimativa de Esforço

| Fase | Esforço | Dependência |
|------|---------|-------------|
| 1 — Fundação | 1–2 dias | Nenhuma |
| 2 — Mensalidades | 3–4 dias | Fase 1 |
| 3 — Caixa | 1–2 dias | Fase 1 |
| 4 — Dashboard | 2–3 dias | Fases 2 e 3 |
| 5 — Visão do Membro | 1–2 dias | Fase 2 |
| 6 — Gateway PIX | 5–7 dias | Fases 2 e 5 + conta PJ |
| **Total MVP (Fases 1–5)** | **~10–13 dias** | — |

---

## 9. Checklist de Prontidão para Iniciar

### Itens verificados e decididos

- [x] **Neon** — sem limite de tabelas; 9 MB de 512 MB usados. **Upgrade após desenvolvimento** → Launch plan (~$15/mês, $0.106/CU-hora + $0.35/GB). Sem urgência no MVP.
- [x] **Vercel Blob** — 1 GB free tier suficiente para MVP. **Upgrade após desenvolvimento** → Pro plan ($20/mês com $20 de crédito incluído; $0.023/GB armazenamento extra, $0.05/GB tráfego extra).
- [x] **Tesoureiro durante testes** — o Admin (`helder@ex2.com.br`) terá acesso ao painel financeiro para testes. Conta de Tesoureiro (role `FINANCEIRO`) será criada antes do go-live.
- [x] **Modelo de cobrança** — **mensal**. Valor e dia de vencimento configuráveis via `ConfigLoja`. Suporta reajustes, negociações, acordos, descontos e isenções.
- [x] **Chave PIX** — parâmetro configurável em `ConfigLoja`. Admin edita em `/admin/config` sem deploy.
- [x] **Membros ativos** — 52 membros. Gerar-lote: ~52 mensalidades/competência em chunks de 10.

### Custo estimado pós-MVP (mensal)

| Serviço | Free | Após upgrade | Quando fazer upgrade |
|---------|------|-------------|---------------------|
| Neon PostgreSQL | 512 MB | ~$15/mês (Launch) | Banco ultrapassar 400 MB ou precisar de SLA |
| Vercel Blob | 1 GB | $20/mês (Pro) | Storage ultrapassar 800 MB ou tráfego > 8 GB/mês |
| Vercel Hosting | Free (Hobby) | $20/mês (Pro) | Precisar de domínio customizado no Vercel ou SLA |
| **Total estimado** | **$0** | **~$35–55/mês** | — |

### Itens pendentes (antes do go-live)

- [ ] Criar conta do Tesoureiro via `/usuarios/novo` (role `FINANCEIRO`, vincular ao membro)
- [ ] Configurar `ConfigLoja` em `/admin/config`: valor padrão, dia vencimento, chave PIX
- [ ] Decidir competência inicial (mês atual vs. retroativo)

### Pergunta aberta

**Retroatividade:** Partir do mês atual ou lançar meses anteriores? Recomendação: começar do mês atual; lançar retroativos manualmente apenas para dívidas conhecidas.
