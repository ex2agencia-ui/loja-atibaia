# Roadmap

Última atualização: Julho 2026

Legendas: 🔴 Alta prioridade · 🟡 Média · 🟢 Baixa · ✅ Concluído

---

## Fase Atual — Consolidação (Q3 2026)

### Bugs e Estabilidade
- [x] ✅ Prisma client regenerado no deploy (postinstall)
- [x] ✅ Neon HTTP — separar create/include em queries independentes
- [x] ✅ DialogTrigger: migrar de asChild para render prop
- [x] ✅ session.user.id undefined no JWT callback
- [x] ✅ Redirect loop após trocar-senha
- [x] ✅ Badge de comunicados não lidos aparece para admin (roles ADMIN/SECRETARIO/CHANCELARIA retornam 0)
- [x] ✅ Comunicado `noFeed`: fallback para primeiro membro ativo quando admin não tem `memberId`
- [x] ✅ Aniversários de casamento não apareciam (`parseBRDate` aceitava só `/`, `dataCasamento` usa `-`)
- [x] ✅ Aniversários de filhos/cônjuge 1 dia adiantados (drift UTC→BRT; corrigido para noon UTC na importação)
- [x] ✅ `useSession` sem `SessionProvider` na página de check-in — adicionado no dashboard layout
- [x] ✅ Infinite re-render na página de sessão (select no useQuery chamava setState em loop)
- [x] ✅ Impressão do QR Code em branco (substituído `window.print()` por janela standalone HTML)
- [x] ✅ URL do QR Code relativa — `NEXT_PUBLIC_APP_URL || window.location.origin` (não `??`)
- [x] ✅ `checkInToken`/`checkInAberto` não existiam em produção — migration rodada via script
- [x] ✅ TypeScript error `NotificacaoCanal` (canal é String no banco, cast necessário)
- [ ] 🔴 Testes manuais de regressão pós-deploy (feed, comunicados, trocar-senha, checkin)

### UX Rápidas
- [ ] 🟡 Confirmação antes de deletar post/comunicado
- [ ] 🟡 Paginação na lista de comunicados do admin
- [ ] 🟡 Indicador de carregamento ao publicar post (disable botão)
- [ ] 🟡 Mensagem quando sessão expira (redirect para login)

---

## Fase 2 — Engajamento (Q4 2026)

### Feed e Social
- [ ] 🔴 Notificações em tempo real (ou polling) quando alguém comenta/reage no seu post
- [ ] 🟡 Edição de post (texto, imagens) pelo autor
- [ ] 🟡 Post fixado no topo (pelo admin)
- [ ] 🟡 Menção de membros com @nome
- [ ] 🟢 Compartilhamento interno de post

### Comunicados
- [ ] 🟡 Comunicados recorrentes (templates reutilizáveis)
- [ ] 🟡 Comunicado por grupo/posição (filtro por cargo: MM, MI, etc.)
- [ ] 🟡 Histórico de leitura mais detalhado (quando abriu, quantas vezes)
- [ ] 🟢 Resposta a comunicado (thread privado entre membro e admin)

### Sessões
- [x] ✅ QR Code de presença — geração automática no criar sessão, impressão com data em destaque, scanner in-app com câmera traseira, card de quórum com auto-refresh 10s
- [ ] 🔴 Contas de usuário para membros — membros precisam de login para usar QR check-in (migração Member → User planejada)
- [ ] 🟡 Pré-lista de convocação (lista dos esperados antes da sessão)
- [ ] 🟡 Notificação de sessão próxima (D-3, D-1)
- [ ] 🟢 Ata digital da sessão (campo rico com exportação PDF)

---

## Fase 3 — Gestão Avançada (Q1 2027)

### Mensageria Outbound (módulo independente — spec: spec-modulo-mensageria.md)
- [ ] 🔴 Infra base: `src/lib/mensageria/`, NotificacaoLog, NotificacaoPreferencia (M1)
- [x] ✅ Canal email SMTP configurável via frontend + criptografia AES-256 (M2 — implementado como parte do módulo financeiro/ConfigLoja)
- [ ] 🔴 Preferências de notificação por membro — aba no perfil (M4)
- [ ] 🟡 Logs de envio e disparo manual pelo admin (M5)
- [ ] 🟡 Cron automático — lembretes de sessão, vencimento de mensalidade (M6)
- [ ] 🟡 WhatsApp link assistido em lote (M8)
- [ ] 🟢 Push Notifications via Web Push API (M9)
- [ ] 🟢 WhatsApp Business API — envio automático (M10)
- [ ] 🟢 SMS via Twilio/Zenvia (M11)

### Financeiro (spec: spec-modulo-financeiro.md)
- [x] ✅ Fundação: schema + ConfigLoja + sidebar (Fase 1)
- [x] ✅ Mensalidades: gerar lote, baixa, acordo, isenção, extrato por membro (Fase 2)
- [x] ✅ Caixa: receitas e despesas com comprovante (Fase 3)
- [x] ✅ Dashboard e relatórios financeiros (Fase 4)
- [x] ✅ Visão do membro — aba financeiro no perfil + banner no feed (Fase 5)
- [ ] 🟡 Por Membro: listagem geral com status financeiro detalhado por competência (mês a mês: pago/atrasado) + link de cobrança individual (Fase 6)
- [ ] 🟢 Gateway PIX (Asaas) — QR Code automático + webhook (Fase 7)

### Membros
- [ ] 🟡 Histórico de cargos por membro (linha do tempo maçônica)
- [ ] 🟡 Documentos do membro (diploma, certidão — upload privado)
- [ ] 🟡 Status de regularidade automático baseado em presença + anuidade
- [ ] 🟢 QR Code no perfil do membro (carteira digital)

### Relatórios
- [ ] 🟡 Presença mínima obrigatória com alerta automático
- [ ] 🟡 Relatório de regularidade (GONB / Grande Loja)
- [ ] 🟡 Exportação de relatórios em PDF

---

## Fase 4 — Plataforma (Q2 2027)

### Multi-Loja
- [ ] 🟡 Suporte a múltiplas Lojas no mesmo sistema (tenant por subdomínio ou slug)
- [ ] 🟡 Admin global entre lojas
- [ ] 🟢 White-label com logo e cores por loja

### Automações
- [ ] 🟡 Email automático de boas-vindas ao criar conta
- [ ] 🟡 Email de lembrete de sessão
- [ ] 🟡 Email semanal de resumo (últimos posts, próxima sessão)
- [ ] 🟢 Integração WhatsApp Business API (comunicados via WhatsApp)

### Mobile
- [ ] 🟡 PWA (Progressive Web App) — instalar no celular
- [ ] 🟡 Push notifications nativas (via Web Push API)
- [ ] 🟢 App React Native (longo prazo)

---

## Backlog (sem prioridade definida)

- Calendário visual de sessões e eventos
- Votações/enquetes nos posts
- Galeria de fotos das sessões
- Pesquisa global (busca em posts, membros, frases)
- Dark mode persistente por usuário
- Audit log de ações administrativas
- Backup automático de dados
- Internacionalização (PT-BR padrão, mas estrutura para EN)
- Integração com Google Calendar para sessões
- Painel público da Loja (sem login) com informações básicas

---

## Como Usar Este Roadmap

1. **Sprint planning**: escolher itens da fase atual com base na prioridade e capacidade
2. **Novas features**: adicionar sempre à fase correta com prioridade inicial 🟢
3. **Bugs**: adicionar em "Consolidação" com 🔴
4. **Concluído**: marcar com `[x] ✅` e mover data de conclusão para `features.md`
