# STORY 3.0: Gestão de Infraestrutura — Status Operacional, Rastreabilidade e Manutenção

**ID:** 3.0 | **Source:** Idea Pack `IDEA-8922D1E7`
**Sprint:** 3 | **Points:** 8 | **Priority:** 🟠 High
**Created:** 2026-03-15
**Status:** 🔄 In Progress
**Predecessor:** Story 1.0 (CRUDs base) + Story 2.0 (Turmas/Matrículas)

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["typecheck", "lint", "vitest"]
secondary_executor: "@data-engineer"  # Novas colunas e tabela chamados
```

**Work Type Breakdown:**
| Task Range | Work Type | Executor | Quality Gate |
|------------|-----------|----------|--------------|
| T1 | Schema/DB/Migrations | @data-engineer | @dev |
| T2-T7 | Code/Features/Logic + UI | @dev | @architect |

---

## User Story

**Como** Equipe de Apoio/TI,
**Quero** rastrear o status operacional de ambientes e recursos, registrar chamados de manutenção e visualizar o histórico de ocorrências,
**Para que** a infraestrutura esteja sempre atualizada e o Coordenador saiba quais espaços estão disponíveis para o planejamento.

---

## Context & Source Traceability

**Idea Pack:** `IDEA-8922D1E7`
**Project:** Gestão Pedagógica
**Focus Module:** Gestão de Infraestrutura (FR-2)
**Mode:** Brownfield — builds on Stories 1.0 + 2.0

### Scope Rationale

Story 1.0 criou CRUDs básicos. Story 2.0 adicionou turmas/matrículas. Esta story evolui a infraestrutura com gestão operacional:

| Layer | O que cobre | FRs Traced |
|-------|-------------|------------|
| Database | Campos status em ambientes/recursos + tabela `chamados` | FR-2 |
| API | Endpoints de status, chamados, histórico | FR-2, FR-12 |
| UI | Dashboard de infraestrutura, chamados, status visual | FR-2, FR-11, FR-12 |
| Business Logic | Transições de status, impacto no planejamento | FR-2, FR-4 |
| Perfil TI | Funcionalidades específicas do Apoio/TI | FR-12 |

---

## Acceptance Criteria

### Status Operacional de Ambientes (FR-2)
- [ ] AC-STA-1: Campo `status` em ambientes (ativo, em_manutencao, desativado) com indicador visual colorido — **Trace:** FR-2
- [ ] AC-STA-2: Alterar status de ambiente com justificativa obrigatória — **Trace:** FR-2
- [ ] AC-STA-3: Filtrar ambientes por status na listagem — **Trace:** FR-2
- [ ] AC-STA-4: Ambientes em manutenção/desativados destacados visualmente na listagem — **Trace:** FR-2

### Status Operacional de Recursos (FR-2)
- [ ] AC-RES-1: Campo `status` em recursos (disponivel, em_uso, em_manutencao, indisponivel) — **Trace:** FR-2
- [ ] AC-RES-2: Alterar status de recurso — **Trace:** FR-2
- [ ] AC-RES-3: Filtrar recursos por status — **Trace:** FR-2

### Chamados de Manutenção (FR-2, FR-12)
- [ ] AC-CHA-1: Criar chamado vinculado a ambiente ou recurso (título, descrição, prioridade, status) — **Trace:** FR-2, FR-12
- [ ] AC-CHA-2: Listar chamados filtráveis por status (aberto, em_andamento, resolvido) e prioridade — **Trace:** FR-2
- [ ] AC-CHA-3: Atualizar status do chamado com comentário — **Trace:** FR-12
- [ ] AC-CHA-4: Ao resolver chamado de manutenção, sugerir atualizar status do ambiente/recurso — **Trace:** FR-2

### Dashboard de Infraestrutura (FR-2)
- [ ] AC-DASH-1: Cards: Total ambientes por status, recursos por status, chamados abertos — **Trace:** FR-2
- [ ] AC-DASH-2: Lista de chamados abertos com prioridade alta visível — **Trace:** FR-2

### Qualidade
- [ ] AC-QUAL-1: Testes unitários para API de chamados e status
- [ ] AC-QUAL-2: Typecheck e lint passando sem erros

---

## Scope

### In Scope
- Campos `status` em ambientes e recursos (migration)
- Tabela `chamados` de manutenção
- CRUD de chamados com workflow de status
- Dashboard de infraestrutura com métricas
- Filtros por status em listagens existentes
- Indicadores visuais de status (badges coloridos)

### Out of Scope (Stories Futuras)
- Algoritmo de alocação considerando status (Story 4.0+)
- Notificações push de chamados (FR-24)
- Gestão de custos de manutenção
- Relatórios de ociosidade (FR-6)
- RBAC granular (quem pode abrir/fechar chamados)

---

## Tasks

### T1: Database Schema — Status e Chamados (1.5h)
- [ ] T1.1: Migration: adicionar `status TEXT DEFAULT 'ativo' CHECK(...)` em `ambientes`
- [ ] T1.2: Migration: adicionar `status TEXT DEFAULT 'disponivel' CHECK(...)` em `recursos`
- [ ] T1.3: Criar tabela `chamados` (id, tipo: 'ambiente'|'recurso', referencia_id UUID, titulo, descricao, prioridade: 'baixa'|'media'|'alta'|'urgente', status: 'aberto'|'em_andamento'|'resolvido', comentario_resolucao, created_at, updated_at)
- [ ] T1.4: RLS policies + tipos TypeScript atualizados

### T2: API Routes — Status de Ambientes e Recursos (1h)
- [ ] T2.1: `PATCH /api/ambientes/[id]/status` — atualizar status com justificativa
- [ ] T2.2: `PATCH /api/recursos/[id]/status` — atualizar status
- [ ] T2.3: Atualizar GET de ambientes e recursos para incluir filtro por status

### T3: API Routes — Chamados (1.5h)
- [ ] T3.1: `GET/POST /api/chamados` com filtros por status, prioridade, tipo
- [ ] T3.2: `GET/PUT /api/chamados/[id]` — detalhe e atualização de status com comentário
- [ ] T3.3: `GET /api/chamados/stats` — contagem por status e prioridade para dashboard

### T4: UI — Status em Ambientes e Recursos (1.5h)
- [ ] T4.1: Badge de status colorido nas tabelas de ambientes e recursos
- [ ] T4.2: Botão/dropdown de alteração de status com modal de justificativa
- [ ] T4.3: Filtro por status nos dropdowns existentes das páginas

### T5: Página CRUD Chamados (2h)
- [ ] T5.1: Página `/chamados` com DataTable (título, tipo, referência, prioridade, status, data)
- [ ] T5.2: Formulário de criação com select de tipo (ambiente/recurso) + select dinâmico da referência
- [ ] T5.3: Badge de prioridade colorido (baixa=verde, média=amarelo, alta=laranja, urgente=vermelho)
- [ ] T5.4: Modal de atualização de status com campo de comentário

### T6: Dashboard de Infraestrutura (1h)
- [ ] T6.1: Página `/infraestrutura` com cards: ambientes por status, recursos por status, chamados abertos
- [ ] T6.2: Lista de chamados abertos com prioridade alta/urgente destacada
- [ ] T6.3: Link na sidebar (seção Infraestrutura)

### T7: Testes + Validação (1h)
- [ ] T7.1: Testes unitários para API de chamados (CRUD + status workflow)
- [ ] T7.2: Testes para status update de ambientes/recursos
- [ ] T7.3: `npm run typecheck` e `npm run lint` passando

---

## Dev Notes

### Predecessor: Stories 1.0 + 2.0
Utiliza: Supabase client, types, shared components, sidebar, dashboard, API patterns.

### Nova Tabela

```sql
-- Migration: adicionar status + chamados
ALTER TABLE ambientes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo'
  CHECK (status IN ('ativo', 'em_manutencao', 'desativado'));

ALTER TABLE recursos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'disponivel'
  CHECK (status IN ('disponivel', 'em_uso', 'em_manutencao', 'indisponivel'));

CREATE TABLE IF NOT EXISTS chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ambiente', 'recurso')),
  referencia_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido')),
  comentario_resolucao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Status Badges
```
Ambientes: ativo=verde, em_manutencao=amarelo, desativado=vermelho
Recursos: disponivel=verde, em_uso=azul, em_manutencao=amarelo, indisponivel=vermelho
Chamados status: aberto=vermelho, em_andamento=amarelo, resolvido=verde
Chamados prioridade: baixa=verde, media=amarelo, alta=laranja, urgente=vermelho
```

### Testing

| Test ID | Name | Type | Priority |
|---------|------|------|----------|
| T-UNIT-1 | CRUD chamados (create, list, update) | Unit | P0 |
| T-UNIT-2 | Status update ambiente com justificativa | Unit | P0 |
| T-UNIT-3 | Filtros por status funcionam | Unit | P1 |
| T-UNIT-4 | Stats endpoint retorna contagens corretas | Unit | P1 |

---

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled (not configured in core-config.yaml)

---

## Dependencies

**Depends on:**
- Story 1.0: CRUDs base (ambientes, recursos) — ✅ Done
- Story 2.0: Turmas/Matrículas — ✅ Done

**Blocks:**
- Story 4.0: Sistema de Relatórios e Alertas

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Chamados CRUD funcional end-to-end
- [ ] Status operacional em ambientes e recursos
- [ ] Dashboard de infraestrutura com métricas
- [ ] Tests passing (unit)
- [ ] `npm run typecheck` ✅
- [ ] `npm run lint` ✅
- [ ] Story checkboxes updated

---

## Dev Agent Record

_To be populated during implementation_

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-15 | 1.0 | Story created from Idea Pack — Módulo Gestão de Infraestrutura | Morgan (PM) |

---

## QA Results

_To be populated after implementation_

---

**Generated by:** Morgan (PM Agent) — AIOS
**Source:** Idea Pack `IDEA-8922D1E7` — FR-2 (Gestão de Infraestrutura)
**Template:** story-2.0
