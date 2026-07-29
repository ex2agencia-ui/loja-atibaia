# Roles e Permissões

## Roles Disponíveis

| Role | Descrição | Usuário típico |
|------|-----------|---------------|
| `ADMIN` | Acesso total | Venerável Mestre / TI |
| `SECRETARIO` | Gestão de membros e sessões | Secretário da Loja |
| `CHANCELARIA` | Gestão de membros e sessões | Chanceler |
| `FINANCEIRO` | Leitura de membros e relatórios | Tesoureiro |
| `MEMBRO` | Acesso ao próprio perfil e feed | Irmão comum |

---

## Matriz de Permissões

| Recurso | ADMIN | SECRETARIO | CHANCELARIA | FINANCEIRO | MEMBRO |
|---------|:-----:|:----------:|:-----------:|:----------:|:------:|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ❌ → /feed |
| **Membros — ver lista** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Membros — criar** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Membros — editar qualquer** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Membros — editar próprio** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Membros — deletar** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sessões — ver** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sessões — criar/editar** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Sessões — deletar** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Presença — registrar** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Feed — ver** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Feed — publicar** | ✅* | ✅* | ✅* | ✅* | ✅ |
| **Classificados — ver** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Classificados — publicar** | ✅* | ✅* | ✅* | ✅* | ✅ |
| **Comunicados — receber** | ✅* | ✅* | ✅* | ✅ | ✅ |
| **Comunicados — enviar** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Relatórios** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Aniversários** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Frases — ver/editar** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Usuários — gerenciar** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Meu Perfil** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Financeiro — ver mensalidades** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Financeiro — baixa/acordo/isenção** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Financeiro — gerar lote** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Configurações da Loja** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Config SMTP (ler/salvar/testar)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Config financeiro/PIX (leitura)** | ✅ | ❌ | ❌ | ✅ | ❌ |

> \* Roles privilegiados podem publicar no feed/classificados somente se tiverem um `memberId` vinculado.  
> ADMIN/SECRETARIO/CHANCELARIA com `noFeed=true` nos comunicados publicam no mural mesmo sem `memberId` próprio (usa o primeiro membro ativo como autor do post).

---

## Navegação por Role (Sidebar)

| Item | ADMIN | SECRETARIO | CHANCELARIA | FINANCEIRO | MEMBRO |
|------|:-----:|:----------:|:-----------:|:----------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mural | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comunicados | ✅ | ✅ | ✅ | ✅ | ✅ |
| Meu Perfil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Irmãos | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sessões | ✅ | ✅ | ✅ | ✅ | ✅ |
| Aniversários | ✅ | ✅ | ✅ | ✅ | ❌ |
| Frases | ✅ | ✅ | ✅ | ❌ | ❌ |
| Classificados | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios | ✅ | ✅ | ❌ | ✅ | ❌ |
| Financeiro | ✅ | ❌ | ❌ | ✅ | ❌ |
| Configurações | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Fluxo de Autenticação

```
Login (email + senha)
        │
        ▼
mustChangePassword?
   Sim ──► /trocar-senha ──► update() ──► re-read JWT ──► destino normal
   Não ──► role === MEMBRO? ──► /feed
                   Não ──► / (dashboard)
```

---

## Constantes no Código

Definidas em `src/lib/permissions.ts`:

```typescript
export const ROLES_READ_ALL_MEMBERS  = ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"]
export const ROLES_WRITE_MEMBERS     = ["ADMIN", "SECRETARIO", "CHANCELARIA"]
export const ROLES_CREATE_MEMBERS    = ["ADMIN", "SECRETARIO"]
export const ROLES_DELETE_MEMBERS    = ["ADMIN"]
export const ROLES_MANAGE_SESSIONS   = ["ADMIN", "SECRETARIO", "CHANCELARIA"]
export const ROLES_VIEW_REPORTS      = ["ADMIN", "SECRETARIO", "FINANCEIRO"]
export const ROLES_SEND_COMUNICADOS  = ["ADMIN", "SECRETARIO", "CHANCELARIA"]
export const ROLES_MANAGE_USERS      = ["ADMIN"]
export const ROLES_FINANCEIRO        = ["ADMIN", "FINANCEIRO"]
export const ROLES_MANAGE_CONFIG     = ["ADMIN"]
```

> O role `FINANCEIRO` tem acesso completo ao módulo financeiro (mensalidades, caixa, relatórios, config PIX), mas **não tem acesso** às configurações de SMTP nem à tela `/admin/config` — essas são exclusivas do `ADMIN`.
