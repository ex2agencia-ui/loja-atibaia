# North Star — Visão de Longo Prazo

## O Produto Que Queremos Construir

**O sistema de gestão que toda Loja Maçônica merece: simples de usar para o irmão comum, poderoso para a administração, e que fortalece o vínculo entre os membros.**

Não é só um sistema de controle. É o hub digital da fraternidade — onde a vida da Loja acontece, é registrada e é compartilhada.

---

## Princípios Guia

### 1. O Membro em Primeiro Lugar
O irmão comum (MEMBRO) não é um usuário secundário — é o usuário mais importante. Tudo que o sistema faz deve ter um valor tangível para ele: saber das sessões, conectar-se com irmãos, divulgar seu trabalho, ser informado pela administração.

> "Se o membro não abre o app toda semana, estamos falhando."

### 2. Zero Fricção para o Admin
O Secretário e o Venerável têm pouco tempo. Qualquer operação repetitiva — registrar presença, enviar comunicado, criar sessão — deve ser feita em menos de 30 segundos. Se demorar mais, simplificar.

### 3. Dado Confiável, Sempre
Presença, anuidade, regularidade — são dados que impactam a vida maçônica do irmão. O sistema deve ser a fonte da verdade, não o caderno do secretário. Isso significa: importação fácil, edição auditada, exportação padronizada.

### 4. Cresce com a Loja
Uma Loja pode ter 20 membros hoje e 200 amanhã. O sistema não deve precisar de migração ou refatoração para isso. Arquitetura que escala: multi-loja, papéis granulares, dados isolados por tenant.

### 5. Segurança como Respeito
Dados maçônicos são sensíveis (endereços, posições, datas de iniciação). Cada role vê exatamente o que precisa, nada mais. Sem atalhos de segurança.

---

## Métricas de Sucesso

| Métrica | Meta 6 meses | Meta 1 ano |
|---------|-------------|-----------|
| % membros com conta ativa | 80% | 95% |
| % membros que abrem o app/semana | 40% | 70% |
| Tempo médio para registrar presença de sessão | < 2 min | < 1 min |
| Comunicados com taxa de leitura > 80% | 1/mês | semanal |
| Sessões sem registro de presença | 0 | 0 |
| NPS dos usuários admin | > 7 | > 9 |

---

## O que o Sistema NÃO é

- Não é um substituto para a vida maçônica presencial — é um suporte
- Não é um sistema financeiro completo (por enquanto) — controle de anuidade sim, contabilidade não
- Não é uma rede social pública — tudo fica dentro da Loja, privado
- Não é um produto SaaS genérico — é feito para Lojas Maçônicas, com a linguagem e a cultura da Ordem

---

## Visão de 2 Anos

```
2026 — Base sólida
  ✅ Membros, sessões, presença
  ✅ Feed e comunicados
  ✅ Roles e permissões
  → Estabilidade e adoção pela Loja Itapetinga

2027 — Gestão completa
  → Financeiro (anuidades, inadimplência)
  → QR de presença
  → Notificações (email, push)
  → Relatórios de regularidade para a Grande Loja

2028 — Plataforma
  → Multi-loja (outras Lojas do Estado)
  → App mobile (PWA ou React Native)
  → Integrações externas (WhatsApp, Google Calendar)
  → Painel público da Loja
```

---

## Como Usar Este Documento

**Para planejar features:** pergunte "isso serve ao membro em primeiro lugar?" e "isso reduz fricção para o admin?". Se as duas respostas forem não, coloque no backlog e siga em frente.

**Para priorizar bugs:** qualquer coisa que impeça o membro de usar o feed ou o admin de registrar presença é P0 — corrige antes de qualquer feature nova.

**Para decisões de arquitetura:** o sistema precisa estar pronto para multi-loja (dados isolados por tenant) e mobile (API REST pura, sem server-side rendering crítico). Decisões que criam dívida nesses dois eixos precisam de justificativa explícita.

**Para novos colaboradores:** leia este documento antes de qualquer código. Ele explica o *porquê* das escolhas, não só o *o quê*.
