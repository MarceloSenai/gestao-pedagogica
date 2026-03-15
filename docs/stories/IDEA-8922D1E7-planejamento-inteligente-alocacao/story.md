# STORY 5.0: Planejamento Inteligente — Motor de Alocação Automática

**ID:** 5.0 | **Source:** Idea Pack `IDEA-8922D1E7`
**Sprint:** 5 | **Points:** 13 | **Priority:** 🔴 Critical
**Created:** 2026-03-15
**Status:** 🔄 In Progress
**Predecessor:** Stories 1.0-4.0 (toda a base de dados)

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["typecheck", "lint", "vitest"]
secondary_executor: "@data-engineer"  # Tabelas alocacoes, planejamentos
```

**Work Type Breakdown:**
| Task Range | Work Type | Executor | Quality Gate |
|------------|-----------|----------|--------------|
| T1 | Schema/DB/Migrations | @data-engineer | @dev |
| T2 | Algorithm Core (lib/) | @dev | @architect |
| T3-T4 | API Routes | @dev | @architect |
| T5-T7 | UI/Pages | @dev | @architect |

---

## User Story

**Como** Coordenador Pedagógico,
**Quero** disparar o algoritmo de alocação que cruza turmas com ambientes disponíveis, respeitando capacidade, recursos necessários e evitando conflitos,
**Para que** eu obtenha uma sugestão otimizada de grade de alocação para o semestre, podendo ajustar manualmente antes de publicar.

---

## Context & Source Traceability

**Idea Pack:** `IDEA-8922D1E7`
**Focus Module:** Planejamento Inteligente (FR-4)
**Mode:** Brownfield — módulo core que usa TODOS os dados das Stories 1.0-4.0

### Scope Rationale — MVP do Motor de Alocação

O idea-pack contém 15 regras de negócio (FR-28 a FR-42) para o Planejamento Inteligente. Para o MVP, implementamos as regras core:

| Regra | FR | Prioridade MVP | Incluída |
|-------|-----|----------------|----------|
| Prevenção de conflitos (hard constraints) | FR-28 | MUST | ✅ |
| Algoritmo de alocação (best-fit) | FR-30 | MUST | ✅ |
| Gestão de conflitos | FR-31 | MUST | ✅ |
| Especialização na alocação | FR-34 | MUST | ✅ |
| Eficiência de lotação | FR-36 | MUST | ✅ |
| Priorização salas comuns | FR-37 | MUST | ✅ |
| Gestão de crise (não alocada) | FR-35 | MUST | ✅ |
| Resolução de impasses (soft) | FR-29 | SHOULD | ✅ Parcial |
| Sugestão troca automática | FR-38 | SHOULD | ⬜ Story futura |
| Flexibilização de horário | FR-39 | SHOULD | ⬜ Story futura |
| Trava pós-publicação | FR-40 | MUST | ✅ |
| Justificativa degradação | FR-41 | MUST | ⬜ Story futura |
| Modo consultivo | FR-42 | MUST | ⬜ Story futura |

---

## Acceptance Criteria

### Motor de Alocação (FR-4, FR-30)
- [ ] AC-ALO-1: Botão "Gerar Alocação" dispara o algoritmo para um semestre selecionado — **Trace:** FR-4, FR-30
- [ ] AC-ALO-2: Algoritmo percorre turmas e para cada uma encontra o melhor ambiente disponível — **Trace:** FR-30
- [ ] AC-ALO-3: Critérios de match: capacidade >= alunos matriculados, recursos do ambiente atendem requisitos da disciplina — **Trace:** FR-30, FR-36
- [ ] AC-ALO-4: Ambientes especializados (laboratórios) priorizados para disciplinas que os necessitam — **Trace:** FR-34, FR-37

### Hard Constraints — Prevenção de Conflitos (FR-28, FR-31)
- [ ] AC-CON-1: Mesmo ambiente não pode ser alocado a duas turmas no mesmo turno — **Trace:** FR-28
- [ ] AC-CON-2: Mesmo docente não pode ter duas turmas no mesmo turno — **Trace:** FR-28, FR-31
- [ ] AC-CON-3: Turma não pode ser alocada em ambiente com capacidade insuficiente — **Trace:** FR-28, FR-36

### Resultado da Alocação (FR-35)
- [ ] AC-RES-1: Resultado mostra lista de alocações (turma → ambiente) com score de compatibilidade — **Trace:** FR-30
- [ ] AC-RES-2: Turmas não alocadas marcadas como "Não Alocada" com motivo — **Trace:** FR-35
- [ ] AC-RES-3: Resumo: total alocadas, não alocadas, taxa de sucesso — **Trace:** FR-35

### Visualização e Ajustes (INT-1, INT-2)
- [ ] AC-VIS-1: Grade visual mostrando ambientes × turnos com turmas alocadas — **Trace:** INT-1
- [ ] AC-VIS-2: Indicadores coloridos: alocada (verde), conflito (vermelho), não alocada (cinza) — **Trace:** INT-1
- [ ] AC-VIS-3: Coordenador pode remover/reatribuir alocação manualmente — **Trace:** INT-2

### Publicação (FR-40)
- [ ] AC-PUB-1: Botão "Publicar Planejamento" congela as alocações (status: publicado) — **Trace:** FR-40
- [ ] AC-PUB-2: Após publicação, alocações ficam somente leitura — **Trace:** FR-40

### Qualidade
- [ ] AC-QUAL-1: Testes unitários para o algoritmo de alocação (cenários: happy path, conflitos, não alocável)
- [ ] AC-QUAL-2: Typecheck e lint passando sem erros

---

## Scope

### In Scope
- Tabelas `planejamentos` e `alocacoes` no Supabase
- Motor de alocação (algoritmo TypeScript no servidor)
- Hard constraints: conflito turno, capacidade, recursos
- Priorização: especializados primeiro, best-fit lotação
- Resultado com turmas não alocadas + motivos
- Grade visual de alocação (ambientes × turnos)
- Ajuste manual pelo coordenador
- Publicação que congela o planejamento

### Out of Scope (Stories Futuras)
- Drag & drop na grade visual (Story 6.0+)
- Sugestão de troca automática (FR-38)
- Flexibilização de horário (FR-39)
- Justificativa obrigatória para degradação (FR-41)
- Modo consultivo em falha (FR-42)
- Ordem de Alteração Extraordinária

---

## Tasks

### T1: Database Schema — Planejamentos e Alocações (1.5h)
- [ ] T1.1: Criar tabela `planejamentos` (id, semestre, ano, status: 'rascunho'|'publicado', created_at, updated_at)
- [ ] T1.2: Criar tabela `alocacoes` (id, planejamento_id FK, turma_id FK, ambiente_id FK nullable, status: 'alocada'|'nao_alocada'|'conflito', motivo TEXT nullable, score NUMERIC, created_at)
- [ ] T1.3: RLS policies + tipos TypeScript
- [ ] T1.4: Aplicar migration no Supabase

### T2: Motor de Alocação — Algoritmo Core (3h)
- [ ] T2.1: Criar `src/lib/allocation/engine.ts` — função principal `runAllocation(turmas, ambientes, ambienteRecursos)`
- [ ] T2.2: Implementar scoring: capacidade fit (penaliza ociosidade e superlotação), recurso match (bonus para match completo)
- [ ] T2.3: Hard constraints: conflito turno (mesmo ambiente/docente), capacidade mínima
- [ ] T2.4: Priorização: disciplinas com recursos especializados primeiro (FR-34), depois básicas (FR-37)
- [ ] T2.5: Output: `AllocationResult[]` com turma_id, ambiente_id, status, motivo, score
- [ ] T2.6: Testes unitários do motor (happy path, conflitos, capacidade, não alocável)

### T3: API Routes — Planejamento (1.5h)
- [ ] T3.1: `GET/POST /api/planejamentos` — listar e criar planejamento
- [ ] T3.2: `GET /api/planejamentos/[id]` — detalhe com alocações
- [ ] T3.3: `POST /api/planejamentos/[id]/executar` — dispara o motor de alocação, salva resultados
- [ ] T3.4: `PATCH /api/planejamentos/[id]/publicar` — muda status para 'publicado'

### T4: API Routes — Alocações (1h)
- [ ] T4.1: `GET /api/planejamentos/[id]/alocacoes` — listar alocações de um planejamento
- [ ] T4.2: `PATCH /api/alocacoes/[id]` — ajuste manual (reatribuir ambiente ou remover)
- [ ] T4.3: `GET /api/planejamentos/[id]/resumo` — stats: alocadas, não alocadas, taxa sucesso

### T5: Página — Planejamentos (1.5h)
- [ ] T5.1: Página `/planejamentos` com lista de planejamentos (semestre, status, data)
- [ ] T5.2: Botão "Novo Planejamento" com form (semestre, ano)
- [ ] T5.3: StatusBadge para rascunho/publicado

### T6: Página — Resultado da Alocação (2h)
- [ ] T6.1: Página `/planejamentos/[id]` com resumo (cards: total, alocadas, não alocadas, taxa)
- [ ] T6.2: Botão "Executar Alocação" que chama a API e mostra loading
- [ ] T6.3: Tabela de alocações: turma, disciplina, ambiente, turno, status (badge), score
- [ ] T6.4: Lista separada de "Não Alocadas" com motivos
- [ ] T6.5: Botão "Publicar" (só se status=rascunho)

### T7: Grade Visual + Sidebar (1.5h)
- [ ] T7.1: Grade visual: tabela ambientes (linhas) × turnos (colunas), células mostram turma alocada ou vazio
- [ ] T7.2: Cores: verde (alocada), vermelho (conflito), cinza (vazio)
- [ ] T7.3: Sidebar: adicionar seção "Planejamento" com link /planejamentos
- [ ] T7.4: Dashboard: adicionar card de planejamentos

---

## Dev Notes

### Algoritmo de Alocação — Lógica

```typescript
interface AllocationInput {
  turmas: Array<{ id: string; disciplina_id: string; docente_id: string | null; turno: string; vagas: number; matriculas_count: number; }>;
  ambientes: Array<{ id: string; capacidade: number; tipo: string; status: string; }>;
  ambienteRecursos: Array<{ ambiente_id: string; recurso_id: string; }>;
  disciplinaRequisitos: Array<{ disciplina_id: string; requisitos_recursos: any[]; }>;
}

function runAllocation(input: AllocationInput): AllocationResult[] {
  // 1. Filtrar ambientes ativos
  // 2. Ordenar turmas: especializadas primeiro (FR-34), depois por tamanho desc
  // 3. Para cada turma:
  //    a. Filtrar ambientes compatíveis (capacidade >= matriculas, recursos match)
  //    b. Excluir ambientes já alocados no mesmo turno (FR-28)
  //    c. Calcular score para cada candidato
  //    d. Selecionar melhor (best-fit)
  //    e. Se nenhum: marcar como não_alocada com motivo
  // 4. Retornar resultado
}

// Scoring:
// - capacidade_fit = 1 - abs(capacidade - alunos) / capacidade (penaliza ociosidade e superlotação)
// - recurso_match = recursos_atendidos / recursos_necessarios
// - score = capacidade_fit * 0.4 + recurso_match * 0.6
```

### Novas Tabelas

```sql
CREATE TABLE planejamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semestre TEXT NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alocacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  ambiente_id UUID REFERENCES ambientes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'nao_alocada' CHECK (status IN ('alocada', 'nao_alocada', 'conflito')),
  motivo TEXT,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Testing

| Test ID | Name | Type | Priority |
|---------|------|------|----------|
| T-UNIT-1 | Alocação happy path: turma + ambiente compatível | Unit | P0 |
| T-UNIT-2 | Conflito turno: mesmo ambiente, mesmo turno | Unit | P0 |
| T-UNIT-3 | Conflito docente: mesmo docente, mesmo turno | Unit | P0 |
| T-UNIT-4 | Capacidade insuficiente → não alocada | Unit | P0 |
| T-UNIT-5 | Recurso incompatível → pula ambiente | Unit | P0 |
| T-UNIT-6 | Especialização: lab priorizado | Unit | P1 |
| T-UNIT-7 | Best-fit: escolhe menor sala suficiente | Unit | P1 |

---

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled

---

## Dependencies

**Depends on:**
- Story 1.0: Entidades core — ✅
- Story 2.0: Turmas, matrículas, matriz recursos — ✅
- Story 3.0: Status ambientes/recursos — ✅
- Story 4.0: Relatórios — ✅

---

## Definition of Done

- [ ] Motor de alocação funcional com hard constraints
- [ ] Testes unitários do algoritmo (7 cenários)
- [ ] Grade visual de alocação
- [ ] Publicação congela planejamento
- [ ] `npm run typecheck` ✅
- [ ] `npm run lint` ✅

---

## Dev Agent Record

_To be populated during implementation_

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-15 | 1.0 | Story created — Motor de Alocação Inteligente (MVP) | Morgan (PM) |

---

## QA Results

_To be populated after implementation_
