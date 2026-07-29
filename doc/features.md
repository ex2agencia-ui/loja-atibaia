# Funcionalidades Implementadas

Estado atual: **Julho de 2026**

---

## ✅ Autenticação e Controle de Acesso

- Login com email e senha (NextAuth Credentials)
- JWT com campos: `id`, `role`, `memberId`, `mustChangePassword`
- Refresh automático do JWT ao chamar `update()` ou quando role ausente
- Troca de senha obrigatória no primeiro acesso (`mustChangePassword`)
- 5 roles com permissões distintas: ADMIN, SECRETARIO, CHANCELARIA, FINANCEIRO, MEMBRO
- Redirect pós-login por role (MEMBRO → `/feed`, demais → `/`)
- Proteção de rotas por `auth()` em cada page/route (sem middleware)

---

## ✅ Gestão de Membros

- Cadastro completo: dados pessoais, maçônicos, cônjuge, filhos
- Dados profissionais: empresa, ramo, ocupação, site, LinkedIn
- Dados de contato: telefone (flag WhatsApp), email, endereço com CEP auto-preenchido
- 4 situações de posição: MI, CM, MM, AM
- Situação: ATIVO / INATIVO
- Busca e filtros na listagem
- Importação via CSV
- Vinculação de conta de usuário (1:1 com User)
- Criação de conta de acesso direto pelo perfil do membro (admin)
- Reset de senha → CIM do membro + flag mustChangePassword

---

## ✅ Sessões e Presença

- Registro de reuniões: tipo (Ordinária, Magna, Especial), data, pauta
- Upload de foto da sessão (Vercel Blob)
- 22 códigos de status de presença (abreviações maçônicas)
- Tabela de presença com todos os membros ativos
- Importação de sessões via CSV
- Exportação de presenças via CSV

---

## ✅ Mural Social (Feed)

- Posts com texto livre e até 4 imagens
- Modo anúncio: converte post em classificado com categoria, validade e contato
- Upload de imagens via drag-and-drop (Vercel Blob, 5 MB/imagem)
- 5 reações emoji: 👍 ❤️ 🙏 😮 😂
- Toggle de reação (clicar remove; clicar outro troca)
- Comentários em posts com reações
- Scroll infinito com IntersectionObserver
- Membros → página home é o feed
- Roles privilegiados veem o feed como módulo lateral

---

## ✅ Classificados / Diretório Profissional

- Lista de perfis profissionais com foto, empresa, ramo
- Cards clicáveis com modal de detalhes
- Modal exibe: telefone (link WhatsApp), email (mailto), site, LinkedIn, empresa, bairro/cidade
- 4 categorias: Serviço, Produto, Oportunidade, Procura
- Validade configurável
- Criação inline via dialog

---

## ✅ Comunicados

- Broadcasts da administração para todos os membros ou selecionados
- Indicação de "publicar também no mural" (noFeed)
- Badge de não lidos na sidebar (polling a cada 60s)
- Marcação automática como lido ao abrir o comunicado
- Admin vê lista de enviados com contagem de destinatários e status de leitura
- Membro vê inbox com destaque para não lidos
- Suporte a imagens no comunicado

---

## ✅ Relatórios

- Relatório de presença: percentuais por membro, por período
- Histórico de sessões com linha do tempo
- Gráfico de distribuição de membros (pizza por situação/posição)

---

## ✅ Aniversariantes

- Lista dos aniversários do mês (membros e cônjuges)
- Filtro por tipo (membro / cônjuge)

---

## ✅ Frases Maçônicas

- Cadastro de frases com autor e tema
- Exibição aleatória no dashboard
- Gerenciamento (criar, editar, ativar/desativar)

---

## ✅ Gestão de Usuários (Admin)

- Listagem de contas de acesso
- Criação manual de usuário com role e vínculo a membro
- Edição de role e dados de acesso
- Reset de senha para o CIM do membro vinculado
- Remoção de conta

---

## ✅ Módulo Financeiro (Fases 1–6)

### Infraestrutura e Schema

- 4 enums financeiros: `TransacaoStatus`, `TransacaoTipo`, `CategoriaFinanceira`, `GatewayTipo`
- Model `Mensalidade`: competência mensal por membro com valor, desconto, juros, vencimento, status, gateway PIX/boleto
- Model `MensalidadeLog`: audit trail de todas as alterações de mensalidade (campo, valorAntes, valorDepois, motivo, userId)
- Model `TransacaoCaixa`: lançamentos avulsos de receita/despesa com categoria e comprovante
- Model `ConfigLoja`: singleton de configuração global (dados da loja, financeiro, SMTP, PIX)
- `src/lib/crypto.ts`: AES-256-GCM para criptografar/descriptografar a senha SMTP
- `ENCRYPTION_KEY` no `.env` — nunca exposta pela API
- `nodemailer` para teste de conexão SMTP e envio de cobranças

### Tela `/financeiro` — Mensalidades (3 sub-views)

- **Por Competência**: navegação mês a mês, cards totalizadores, tabela com ações inline (baixa, acordo, isentar), geração de lote
- **Por Membro**: select de membro, cards de totais, lista de competências expansível com `MensalidadeLog` (audit trail) + lançamentos avulsos vinculados
- **Visão Geral**: listagem de todos os membros ativos com resumo financeiro (vencidas + valor em aberto), expand por membro para detalhe de cada competência vencida, seleção múltipla e envio de cobrança por canal

### Cobrança Individual (Visão Geral)

- Seleção de uma ou mais mensalidades vencidas por membro
- Modal de cobrança com escolha de canal: **Comunicado** (notificação no sistema) ou **Email** (via SMTP configurado)
- Mensagem gerada automaticamente com competências, valores e chave PIX da Loja
- Validação: avisa se membro não tem email cadastrado; bloqueia email se SMTP não configurado
- API: `POST /api/financeiro/cobranca`

### Tela `/admin/config` — Configurações da Loja

- Formulário em 4 abas: **Loja** (nome, CNPJ, contato, endereço), **Financeiro** (valor padrão, dia de vencimento), **E-mail/SMTP** (host, porta, TLS, usuário, senha — campo senha nunca retorna o valor cifrado), **PIX** (chave, tipo, beneficiário)
- Botão "Testar conexão" na aba SMTP

### Tela `/financeiro` — Caixa

- Tabela de receitas e despesas com filtros (tipo, categoria, período, busca)
- Cards totalizadores: receitas / despesas / saldo do período
- Sheet "Novo lançamento": tipo, categoria, valor, data, descrição, membro opcional, upload de comprovante

### Tela `/financeiro` — Dashboard

- 4 KPI cards: arrecadado no mês, pendente em aberto, saldo de caixa, taxa de inadimplência
- Gráfico de barras (Recharts): receitas vs. despesas dos últimos 6 meses
- Tabela de inadimplentes com links WhatsApp

### Tela `/financeiro` — Relatórios

- Balancete por categoria com seletor de período
- Exportação CSV

### Visão do Membro (`/perfil` aba Financeiro)

- Status geral: "Em dia" (verde) ou "Pendências — R$ XX,XX" (amarelo)
- Tabela read-only de mensalidades com status amigável
- Seção "Como pagar" com chave PIX da Loja e botão copiar
- Guard: MEMBRO só acessa o próprio extrato; lazy update PENDENTE → VENCIDO na query

### Banner de Inadimplência (Feed)

- Exibido apenas para role MEMBRO com mensalidades VENCIDAS
- Linguagem fraternal, link para `/perfil?tab=financeiro`
- Dismissível por sessão (sessionStorage)

### APIs

- `GET/PUT/POST /api/admin/config` — ConfigLoja completa com SMTP criptografado
- `GET /api/financeiro/config` — subset financeiro/PIX (sem SMTP)
- `GET /api/financeiro/mensalidades` — lista por competência com totalizadores
- `GET /api/financeiro/mensalidades/membro/[id]` — extrato por membro (guard por role)
- `GET /api/financeiro/mensalidades/visao-geral` — todos os membros com resumo + vencidas
- `POST /api/financeiro/mensalidades/gerar-lote` — geração em lote
- `GET/PUT /api/financeiro/mensalidades/[id]` — detalhe e ações (baixa, acordo, isenção, reabrir, editar)
- `GET/POST /api/financeiro/caixa` — lançamentos de caixa
- `GET/DELETE /api/financeiro/caixa/[id]` — detalhe e exclusão (ADMIN)
- `GET /api/financeiro/dashboard` — KPIs e série histórica
- `GET /api/financeiro/inadimplentes` — membros inadimplentes agrupados
- `GET /api/financeiro/relatorio` — balancete JSON ou CSV
- `POST /api/financeiro/cobranca` — envio de cobrança por email ou comunicado

### Padrão Neon HTTP (anti-transação)

Todas as operações em lote usam `Promise.all` de operações individuais. Proibido: `createMany`, `updateMany`, `deleteMany`, `create({ include })` — todos disparam transação implícita no Neon HTTP serverless.

---

## ✅ Infraestrutura

- Deploy: Vercel (produção)
- Banco: Neon PostgreSQL serverless
- Storage: Vercel Blob para imagens
- `postinstall: prisma generate` no package.json (regenera client no deploy)
- CEP auto-preenchimento via ViaCEP
- Toast notifications (Sonner)
- Tema escuro/claro (next-themes)
- Analytics (Vercel Analytics)
- Responsivo com sidebar colapsável em mobile
