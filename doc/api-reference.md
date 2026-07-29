# Referência da API

Base URL: `/api`

Todas as rotas requerem sessão autenticada (NextAuth JWT cookie), exceto `/api/auth/*`.

---

## Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/[...nextauth]` | NextAuth handler (login/logout) |
| GET | `/api/me` | Retorna `{ role, memberId, membroNome }` do usuário logado |
| PUT | `/api/usuario/senha` | Troca a senha do usuário logado |

---

## Membros

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/membros` | ADMIN, SECRETARIO, CHANCELARIA, FINANCEIRO | Lista membros (com busca, filtros, paginação) |
| POST | `/api/membros` | ADMIN, SECRETARIO | Cria novo membro |
| GET | `/api/membros/[id]` | Acima + MEMBRO (próprio) | Detalhe do membro |
| PUT | `/api/membros/[id]` | ADMIN, SECRETARIO, CHANCELARIA + MEMBRO (próprio) | Atualiza membro |
| DELETE | `/api/membros/[id]` | ADMIN | Remove membro |
| POST | `/api/membros/import` | ADMIN, SECRETARIO | Importa membros via CSV |

---

## Sessões

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/sessoes` | Todos autenticados | Lista sessões |
| POST | `/api/sessoes` | ADMIN, SECRETARIO, CHANCELARIA | Cria sessão |
| GET | `/api/sessoes/[id]` | Todos | Detalhe da sessão |
| PUT | `/api/sessoes/[id]` | ADMIN, SECRETARIO, CHANCELARIA | Atualiza sessão |
| DELETE | `/api/sessoes/[id]` | ADMIN | Remove sessão |
| GET | `/api/sessoes/[id]/presenca` | Todos | Lista presenças da sessão |
| POST | `/api/sessoes/[id]/presenca` | ADMIN, SECRETARIO, CHANCELARIA | Registra presença |
| POST | `/api/sessoes/[id]/foto` | ADMIN, SECRETARIO | Upload foto (Vercel Blob) |
| DELETE | `/api/sessoes/[id]/foto` | ADMIN, SECRETARIO | Remove foto |
| POST | `/api/sessoes/import` | ADMIN | Importa sessões via CSV |

---

## Feed / Posts

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/posts` | Todos | Lista posts (cursor pagination, `?cursor=`, `?limit=`) |
| POST | `/api/posts` | Todos com memberId | Cria post |
| GET | `/api/posts/[id]` | Todos | Detalhe do post |
| DELETE | `/api/posts/[id]` | Autor ou ADMIN | Remove post |
| POST | `/api/posts/[id]/reacao` | Todos com memberId | Adiciona/troca reação |
| DELETE | `/api/posts/[id]/reacao` | Todos com memberId | Remove reação |
| GET | `/api/posts/[id]/comentarios` | Todos | Lista comentários |
| POST | `/api/posts/[id]/comentarios` | Todos com memberId | Cria comentário |

---

## Comentários

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/comentarios/[id]` | Todos | Detalhe do comentário |
| DELETE | `/api/comentarios/[id]` | Autor ou ADMIN | Remove comentário |
| POST | `/api/comentarios/[id]/reacao` | Todos com memberId | Adiciona/troca reação |
| DELETE | `/api/comentarios/[id]/reacao` | Todos com memberId | Remove reação |

---

## Classificados

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/classificados` | Todos | Lista classificados ativos |
| POST | `/api/classificados` | Todos com memberId | Cria classificado |
| GET | `/api/classificados/[id]` | Todos | Detalhe |
| PUT | `/api/classificados/[id]` | Autor ou ADMIN | Atualiza |
| DELETE | `/api/classificados/[id]` | Autor ou ADMIN | Remove |

---

## Comunicados

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/comunicados` | Todos | Admin: lista enviados; Membro: lista recebidos |
| POST | `/api/comunicados` | ADMIN, SECRETARIO, CHANCELARIA | Envia comunicado para membros |
| GET | `/api/comunicados/[id]` | Emissor ou destinatário | Detalhe (membro: marca como lido) |
| DELETE | `/api/comunicados/[id]` | ADMIN, SECRETARIO, CHANCELARIA | Remove |
| GET | `/api/comunicados/nao-lidos` | MEMBRO, FINANCEIRO | Contagem de não lidos |

### POST /api/comunicados — Body

```json
{
  "titulo": "string",
  "texto": "string",
  "imagens": ["url1", "url2"],
  "noFeed": false,
  "destinatarios": "todos | selecionar",
  "membrosIds": ["id1", "id2"]
}
```

---

## Usuários

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/usuarios` | ADMIN | Lista usuários |
| POST | `/api/usuarios` | ADMIN | Cria conta de usuário |
| GET | `/api/usuarios/[id]` | ADMIN | Detalhe |
| PUT | `/api/usuarios/[id]` | ADMIN | Atualiza (role, email, nome) |
| DELETE | `/api/usuarios/[id]` | ADMIN | Remove conta |
| POST | `/api/usuarios/[id]/reset-senha` | ADMIN | Reseta senha para CIM do membro |

---

## Relatórios

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/relatorios/presenca` | ADMIN, SECRETARIO, FINANCEIRO | Estatísticas de presença |
| GET | `/api/relatorios/historico` | ADMIN, SECRETARIO, FINANCEIRO | Histórico por período |

---

## Upload

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/upload` | Upload para Vercel Blob. Body: `multipart/form-data`, campo `file`. Limite: 5 MB, tipos: JPEG/PNG/WebP/GIF. Retorna `{ url, key }` |

---

## Admin — Configurações

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/admin/config` | ADMIN | Retorna ConfigLoja (sem `smtpPassEncrypted`; retorna `smtpPassConfigured: boolean`) |
| PUT | `/api/admin/config` | ADMIN | Salva ConfigLoja; criptografa `smtpPass` com AES-256-GCM se enviada |
| POST | `/api/admin/config` | ADMIN | Testa conexão SMTP via nodemailer (body: campos SMTP) |

### GET /api/admin/config — Resposta

```json
{
  "id": "singleton",
  "nome": "Loja Maçônica",
  "mensalidadeValorPadrao": "50.00",
  "mensalidadeDiaVencimento": 10,
  "pixChave": "...",
  "pixTipo": "cpf",
  "pixBeneficiario": "...",
  "smtpHost": "...",
  "smtpPort": 587,
  "smtpSecure": false,
  "smtpUser": "...",
  "smtpPassConfigured": true,
  "emailRemetente": "...",
  "emailNomeRemetente": "...",
  "cnpj": "...",
  "email": "...",
  "telefone": "...",
  "endereco": "..."
}
```

### PUT /api/admin/config — Body

```json
{
  "nome": "string",
  "mensalidadeValorPadrao": 50,
  "mensalidadeDiaVencimento": 10,
  "pixChave": "string",
  "pixTipo": "cpf | cnpj | email | telefone | aleatoria",
  "pixBeneficiario": "string",
  "smtpHost": "string",
  "smtpPort": 587,
  "smtpSecure": false,
  "smtpUser": "string",
  "smtpPass": "string (opcional — omitir para manter a atual)",
  "emailRemetente": "string",
  "emailNomeRemetente": "string",
  "cnpj": "string",
  "email": "string",
  "telefone": "string",
  "endereco": "string"
}
```

---

## Financeiro — Configuração

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/financeiro/config` | ADMIN, FINANCEIRO | Retorna subset financeiro da ConfigLoja (sem campos SMTP) |

---

## Financeiro — Mensalidades

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| GET | `/api/financeiro/mensalidades` | ADMIN, FINANCEIRO | Lista membros ativos com mensalidade da competência + totalizadores |
| GET | `/api/financeiro/mensalidades/membro/[id]` | ADMIN, FINANCEIRO | Extrato por membro: mensalidades com logs + lançamentos avulsos |
| POST | `/api/financeiro/mensalidades/gerar-lote` | ADMIN, FINANCEIRO | Gera mensalidades em lote para a competência, pula existentes |
| GET | `/api/financeiro/mensalidades/[id]` | ADMIN, FINANCEIRO | Detalhe de uma mensalidade |
| PUT | `/api/financeiro/mensalidades/[id]` | ADMIN, FINANCEIRO | Ações sobre uma mensalidade (ver abaixo) |

### GET /api/financeiro/mensalidades — Query params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `competencia` | `YYYY-MM` | Mês/ano da competência (obrigatório) |
| `status` | `PENDENTE\|PAGO\|VENCIDO\|CANCELADO` | Filtro opcional por status |

### GET /api/financeiro/mensalidades — Resposta

```json
{
  "items": [
    {
      "memberId": "...",
      "nome": "...",
      "cim": "...",
      "mensalidade": { /* objeto Mensalidade ou null */ }
    }
  ],
  "totais": {
    "total": 10,
    "pagos": 3,
    "pendentes": 5,
    "vencidos": 2,
    "isentos": 1,
    "valorArrecadado": "150.00",
    "valorPendente": "250.00"
  }
}
```

### PUT /api/financeiro/mensalidades/[id] — Body (action-based)

```json
{
  "acao": "baixa | acordo | isencao | reabrir | editar",
  "dataPagamento": "2026-07-15",
  "valor": 50.00,
  "desconto": 5.00,
  "jurosMulta": 2.00,
  "observacao": "string",
  "motivo": "string"
}
```

Todas as ações gravam um `MensalidadeLog` com `campo`, `valorAntes`, `valorDepois`, `motivo` e `userId`.

### POST /api/financeiro/mensalidades/gerar-lote — Body

```json
{
  "competencia": "2026-07",
  "valor": 50.00,
  "vencimento": "2026-07-10"
}
```

---

## Utilitários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cep?cep=01310100` | Consulta ViaCEP, retorna logradouro/bairro/cidade |
| GET | `/api/aniversarios` | Aniversariantes do mês atual |
| GET | `/api/frases/random` | Frase aleatória ativa |
| GET | `/api/frases` | Lista frases |
| POST | `/api/frases` | Cria frase (ADMIN) |
| PUT | `/api/frases/[id]` | Atualiza frase (ADMIN) |
| DELETE | `/api/frases/[id]` | Remove frase (ADMIN) |
