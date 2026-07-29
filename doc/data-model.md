# Modelo de Dados

## Diagrama de Relações (simplificado)

```
User ──────────── Member (1:1, opcional)
                     │
              ┌──────┼──────────────────────┬───────────────────────┐
              │      │                      │                       │
           Filho  Presenca              Post / Classificado /   Mensalidade ── MensalidadeLog
                     │                  Reacao / Comentario     TransacaoCaixa
                LojaSession          Comunicado ── ComunicadoDestinatario

ConfigLoja (singleton — id = "singleton")
```

---

## Modelos

### User

Conta de acesso ao sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| name | String? | Nome de exibição |
| email | String (unique) | Login |
| password | String? | Hash bcrypt |
| role | UserRole | Nível de acesso |
| mustChangePassword | Boolean | Flag de troca obrigatória |
| memberId | String? (unique) | FK → Member (1:1) |
| createdAt | DateTime | — |
| updatedAt | DateTime | — |

**UserRole enum:** `ADMIN` `SECRETARIO` `FINANCEIRO` `CHANCELARIA` `MEMBRO`

---

### Member

Dados maçônicos e pessoais do irmão.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| cim | String (unique) | Número do CIM |
| situacao | MemberSituacao | ATIVO / INATIVO |
| nome | String | Nome completo |
| dataNascimento | DateTime? | — |
| posicao | Posicao? | Cargo atual |
| dataIniciacao | DateTime? | — |
| dataElevacao | DateTime? | — |
| dataExaltacao | DateTime? | — |
| dataInstalacao | DateTime? | — |
| dataRegulFiliacao | DateTime? | Filiação regular |
| rua / numero / complemento / bairro / cep / cidade | String? | Endereço |
| telefone | String? | — |
| isWhatsapp | Boolean | telefone é WhatsApp? |
| email | String? | Email pessoal |
| ocupacao / notasOcupacao / empresa / ramoAtuacao / site / linkedin | String? | Dados profissionais |
| conjuge | String? | Nome do cônjuge |
| nascimentoConjuge | DateTime? | — |
| dataCasamento | DateTime? | — |

**MemberSituacao:** `ATIVO` `INATIVO`

**Posicao:** `MI` (Mestre Instalado) `CM` (Conselho de Maiores) `MM` (Mestre Maçom) `AM` (Aprendiz Maçom)

---

### Filho

Filhos do membro.

| Campo | Tipo |
|-------|------|
| id | String (cuid) |
| memberId | FK → Member |
| nome | String |
| dataNascimento | DateTime? |

---

### Post

Publicações no mural (feed).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| memberId | FK → Member | Autor |
| tipo | PostTipo | FEED ou CLASSIFICADO |
| texto | String (Text) | Conteúdo |
| imagens | String[] | URLs Vercel Blob |
| titulo | String? | Somente classificados |
| categoria | CategoriaClassificado? | Somente classificados |
| contato | String? | Contato para classificados |
| expiresAt | DateTime? | Validade (classificados) |
| ativo | Boolean | Visível ou não |
| createdAt / updatedAt | DateTime | — |

**PostTipo:** `FEED` `CLASSIFICADO`

---

### Comentario

Comentário em um Post.

| Campo | Tipo |
|-------|------|
| id | String (cuid) |
| postId | FK → Post |
| memberId | FK → Member |
| texto | String (Text) |
| imagens | String[] |
| createdAt / updatedAt | DateTime |

---

### Reacao

Reação emoji em Post ou Comentário (um por membro por alvo).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| emoji | String | 👍 ❤️ 🙏 😮 😂 |
| memberId | FK → Member | — |
| postId | FK → Post? | null se em comentário |
| comentarioId | FK → Comentario? | null se em post |
| createdAt | DateTime | — |

**Constraint unique:** `[memberId, postId]` e `[memberId, comentarioId]`

---

### Comunicado

Mensagem da administração para membros.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| autorId | FK → User | Quem enviou |
| titulo | String | Assunto |
| texto | String (Text) | Conteúdo |
| imagens | String[] | Anexos |
| noFeed | Boolean | Publicar também no mural |
| postId | String? (unique) | FK → Post (se noFeed) |
| createdAt / updatedAt | DateTime | — |

---

### ComunicadoDestinatario

Relação many-to-many Comunicado ↔ Member com status de leitura.

| Campo | Tipo |
|-------|------|
| id | String (cuid) |
| comunicadoId | FK → Comunicado |
| memberId | FK → Member |
| lidoEm | DateTime? |
| createdAt | DateTime |

**Constraint unique:** `[comunicadoId, memberId]`

---

### LojaSession

Reunião/sessão da Loja.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| data | DateTime | Data da sessão |
| descricao | String? | Pauta |
| tipo | SessionTipo | ORDINARIA / MAGNA / ESPECIAL |
| fotoUrl | String? | URL Vercel Blob |
| fotoKey | String? | Pathname Vercel Blob |
| checkInToken | String? (unique) | UUID gerado na criação — identifica o QR Code |
| checkInAberto | Boolean | Toggle abrir/fechar check-in por QR (padrão false) |
| createdAt / updatedAt | DateTime | — |

---

### Presenca

Registro de presença de um membro em uma sessão.

| Campo | Tipo |
|-------|------|
| id | String (cuid) |
| memberId | FK → Member |
| sessionId | FK → LojaSession |
| status | PresencaStatus |
| observacao | String? |
| createdAt / updatedAt | DateTime |

**PresencaStatus (abreviações maçônicas):** `NV` `K` `AB` `SU` `F` `FM` `FR` `BAN` `REP` `IN` `IND` `IP` `EL` `EX` `MI` `MM` `CM` `AM` `P` `REG` `SM` `ZERO`

---

### Classificado

Anúncio profissional (modelo legado, paralelo ao Post tipo CLASSIFICADO).

| Campo | Tipo |
|-------|------|
| id | String (cuid) |
| memberId | FK → Member |
| titulo | String |
| descricao | String |
| categoria | CategoriaClassificado |
| contato | String? |
| ativo | Boolean |
| expiresAt | DateTime? |
| createdAt / updatedAt | DateTime |

**CategoriaClassificado:** `SERVICO` `PRODUTO` `OPORTUNIDADE` `PROCURA`

---

### Frase

Citação/frase maçônica para exibição aleatória.

| Campo | Tipo |
|-------|------|
| id | String (cuid) |
| texto | String |
| autor | String |
| descricaoAutor | String? |
| tema | String? |
| ativo | Boolean |
| createdAt / updatedAt | DateTime |

---

## Módulo Financeiro

### Enums Financeiros

**TransacaoStatus:** `PENDENTE` `PAGO` `VENCIDO` `CANCELADO`

**TransacaoTipo:** `RECEITA` `DESPESA`

**CategoriaFinanceira:** `MENSALIDADE` `TRONCO_SOLIDARIEDADE` `TAXA_GRAU` `DOACAO` `MANUTENCAO_TEMPLO` `AGAPE` `REPASSE_POTENCIA` `OUTROS`

**GatewayTipo:** `MANUAL` `C6BANK` `CORA` `ASAAS` `STRIPE` `MERCADO_PAGO`

---

### Mensalidade

Cobrança mensal de um membro para uma competência específica.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| memberId | FK → Member | Membro devedor |
| competencia | String | Formato `"YYYY-MM"` ex: `"2026-07"` |
| valor | Decimal(10,2) | Valor base da mensalidade |
| desconto | Decimal(10,2)? | Desconto aplicado |
| jurosMulta | Decimal(10,2)? | Juros/multa por atraso |
| valorTotal | Decimal(10,2) | Valor final cobrado |
| vencimento | DateTime | Data de vencimento |
| pagamento | DateTime? | Data do pagamento efetivo |
| status | TransacaoStatus | `PENDENTE` / `PAGO` / `VENCIDO` / `CANCELADO` |
| isento | Boolean | Membro isento desta competência |
| observacao | String? | Notas livres |
| gateway | GatewayTipo | Forma de pagamento (`MANUAL` padrão) |
| externalId | String? | ID externo do gateway |
| pixQrCode | String? | QR Code PIX (base64) |
| pixCopiaECola | String? | PIX copia e cola |
| boletoUrl | String? | URL do boleto |
| emailAvisoEm | DateTime? | Quando foi enviado aviso de vencimento |
| emailVencidoEm | DateTime? | Quando foi enviado aviso de vencida |
| registradoPorId | String? | userId de quem registrou o pagamento |
| createdAt / updatedAt | DateTime | — |

**Constraint unique:** `[memberId, competencia]`

---

### MensalidadeLog

Audit trail de alterações em uma Mensalidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| mensalidadeId | FK → Mensalidade | — |
| campo | String | Campo alterado (ex: `"status"`, `"valor"`, `"isento"`) |
| valorAntes | String? | Valor anterior serializado como string |
| valorDepois | String? | Valor novo serializado como string |
| motivo | String? | Justificativa da alteração |
| userId | String | ID do usuário que realizou a alteração |
| createdAt | DateTime | — |

---

### TransacaoCaixa

Lançamento avulso de receita ou despesa no caixa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| tipo | TransacaoTipo | `RECEITA` ou `DESPESA` |
| categoria | CategoriaFinanceira | Natureza do lançamento |
| descricao | String | Descrição livre |
| valor | Decimal(10,2) | Valor do lançamento |
| data | DateTime | Data do lançamento (padrão: now) |
| memberId | String? | FK → Member (opcional, ex: taxas de grau) |
| registradoPorId | String | userId de quem registrou |
| comprovanteUrl | String? | URL do comprovante (Vercel Blob) |
| createdAt / updatedAt | DateTime | — |

---

### ConfigLoja

Configuração global da Loja (singleton — sempre `id = "singleton"`).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | PK fixo `"singleton"` |
| nome | String | Nome da Loja |
| mensalidadeValorPadrao | Decimal(10,2) | Valor padrão ao gerar lote |
| mensalidadeDiaVencimento | Int | Dia do mês para vencimento |
| pixChave | String? | Chave PIX |
| pixTipo | String? | Tipo da chave: `cpf` / `cnpj` / `email` / `telefone` / `aleatoria` |
| pixBeneficiario | String? | Nome do beneficiário PIX |
| smtpHost | String? | Servidor SMTP |
| smtpPort | Int? | Porta SMTP (padrão 587) |
| smtpSecure | Boolean | TLS/SSL direto |
| smtpUser | String? | Usuário SMTP |
| smtpPassEncrypted | String? | Senha SMTP cifrada com AES-256-GCM (nunca exposta via API) |
| emailRemetente | String? | Endereço de envio |
| emailNomeRemetente | String? | Nome de exibição do remetente |
| cnpj | String? | CNPJ da Loja |
| email | String? | E-mail institucional |
| telefone | String? | Telefone institucional |
| endereco | String? | Endereço da sede |
| updatedAt | DateTime | — |
