# STORY 4.0: Sistema de Relatórios e Alertas — Ociosidade, Utilização e Desempenho

**ID:** 4.0 | **Source:** Idea Pack `IDEA-8922D1E7`
**Sprint:** 4 | **Points:** 8 | **Priority:** 🟠 High
**Created:** 2026-03-15
**Status:** 🔄 In Progress
**Predecessor:** Stories 1.0-3.0

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["typecheck", "lint", "vitest"]
```

---

## User Story

**Como** Gestor,
**Quero** visualizar relatórios de utilização de ambientes, ociosidade de recursos, desempenho de alocação e receber alertas sobre situações críticas,
**Para que** eu possa tomar decisões informadas sobre investimentos e otimização da infraestrutura.

---

## Context & Source Traceability

**Idea Pack:** `IDEA-8922D1E7`
**Focus Module:** Sistema de Relatórios e Alertas (FR-6)
**Mode:** Brownfield — builds on Stories 1.0-3.0

| Layer | O que cobre | FRs Traced |
|-------|-------------|------------|
| API | Endpoints de relatórios e métricas | FR-6, FR-7 |
| UI | Páginas de relatórios com gráficos/tabelas | FR-6, FR-7, FR-11 |
| Business Logic | Cálculos de ociosidade e utilização | FR-6, FR-36 |

---

## Acceptance Criteria

### Relatório de Utilização de Ambientes (FR-6)
- [ ] AC-UTI-1: Visualizar taxa de ocupação por ambiente (turmas alocadas / capacidade) — **Trace:** FR-6, FR-36
- [ ] AC-UTI-2: Listar ambientes ociosos (sem turmas atribuídas) — **Trace:** FR-6
- [ ] AC-UTI-3: Filtrar por prédio e período (semestre) — **Trace:** FR-6

### Relatório de Recursos (FR-6)
- [ ] AC-REC-1: Visualizar recursos mais demandados (contagem de requisitos nas disciplinas) — **Trace:** FR-6
- [ ] AC-REC-2: Identificar recursos em falta (demandados mas em manutenção/indisponíveis) — **Trace:** FR-6

### Relatório de Demanda Pedagógica (FR-6, FR-7)
- [ ] AC-DEM-1: Total de alunos matriculados por curso — **Trace:** FR-6
- [ ] AC-DEM-2: Taxa de ocupação média por curso (matrículas / vagas) — **Trace:** FR-6, FR-36
- [ ] AC-DEM-3: Turmas com lotação crítica (> 90%) destacadas — **Trace:** FR-6

### Dashboard de Relatórios (FR-7)
- [ ] AC-DASH-1: Página central com KPIs: total ambientes, taxa ocupação média, chamados abertos, recursos indisponíveis — **Trace:** FR-7
- [ ] AC-DASH-2: Gráfico de barras com ocupação por curso — **Trace:** FR-7

### Qualidade
- [ ] AC-QUAL-1: Testes unitários para endpoints de relatórios
- [ ] AC-QUAL-2: Typecheck e lint passando sem erros

---

## Scope

### In Scope
- API endpoints para métricas e relatórios
- Página de relatórios com tabelas e indicadores visuais
- KPIs de utilização, ociosidade e demanda
- Gráfico de barras simples (CSS, sem lib externa)
- Filtros por prédio, curso e semestre

### Out of Scope
- Exportação PDF/Excel
- Relatórios automáticos por email
- Notificações push (FR-24)
- Gráficos complexos com D3/Chart.js (futuro)

---

## Tasks

### T1: API de Relatórios (2h)
- [ ] T1.1: `GET /api/relatorios/utilizacao-ambientes` — retorna ambientes com count de turmas alocadas, taxa de ocupação, filtro por predio_id e semestre
- [ ] T1.2: `GET /api/relatorios/recursos-demanda` — recursos mais requisitados (contagem de disciplinas que os requerem) + status
- [ ] T1.3: `GET /api/relatorios/demanda-pedagogica` — matrículas por curso, taxa de ocupação por curso, turmas críticas
- [ ] T1.4: `GET /api/relatorios/kpis` — totais consolidados para dashboard

### T2: Página de Relatórios — Utilização de Ambientes (1.5h)
- [ ] T2.1: Página `/relatorios/ambientes` com tabela: ambiente, prédio, capacidade, turmas alocadas, taxa ocupação
- [ ] T2.2: Filtros por prédio e semestre
- [ ] T2.3: Destaque visual para ambientes ociosos (0%) e superlotados (>90%)
- [ ] T2.4: StatusBadge para indicar nível de ocupação

### T3: Página de Relatórios — Demanda Pedagógica (1.5h)
- [ ] T3.1: Página `/relatorios/demanda` com tabela: curso, total turmas, alunos, vagas, taxa ocupação
- [ ] T3.2: Gráfico de barras horizontal (CSS puro) mostrando ocupação por curso
- [ ] T3.3: Lista de turmas com lotação crítica (> 90%)

### T4: Página de Relatórios — Recursos (1h)
- [ ] T4.1: Página `/relatorios/recursos` com tabela: recurso, quantidade total, disciplinas que requerem, status
- [ ] T4.2: Destaque para recursos indisponíveis/em manutenção que são demandados

### T5: Dashboard de Relatórios + Sidebar (1h)
- [ ] T5.1: Página `/relatorios` com cards de KPIs (total ambientes ativos, ocupação média, chamados abertos, recursos indisponíveis)
- [ ] T5.2: Links para cada relatório específico
- [ ] T5.3: Adicionar seção "Relatórios" na sidebar com links

### T6: Testes + Validação (1h)
- [ ] T6.1: Testes unitários para API de relatórios
- [ ] T6.2: `npm run typecheck` e `npm run lint` passando

---

## Dev Notes

### Predecessor: Stories 1.0-3.0
Dados disponíveis: predios, ambientes (com status), recursos (com status), cursos, disciplinas (com requisitos_recursos), turmas, matriculas, chamados.

### Cálculos de Métricas

```
Utilização ambiente = COUNT(turmas WHERE disciplina.curso has turma using this ambiente)
  → Simplificação: contar turmas que PODERIAM usar o ambiente (via requisitos compatíveis)
  → MVP: contar turmas existentes / capacidade do ambiente

Ocupação curso = SUM(matriculas por turma do curso) / SUM(vagas por turma do curso) * 100

Recursos demandados = COUNT(disciplinas WHERE requisitos_recursos JSONB contém o recurso)

KPIs:
  - ambientes_ativos: COUNT(ambientes WHERE status='ativo')
  - ocupacao_media: AVG de ocupação por turma
  - chamados_abertos: COUNT(chamados WHERE status='aberto')
  - recursos_indisponiveis: COUNT(recursos WHERE status IN ('em_manutencao','indisponivel'))
```

### Gráfico de barras CSS
```tsx
// Barra horizontal simples
<div className="flex items-center gap-3">
  <span className="w-32 text-sm truncate">{curso}</span>
  <div className="flex-1 bg-gray-200 rounded-full h-3">
    <div className={`${cor} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
  </div>
  <span className="w-12 text-sm text-right">{pct}%</span>
</div>
```

### Testing

| Test ID | Name | Type | Priority |
|---------|------|------|----------|
| T-UNIT-1 | KPIs endpoint retorna todos os campos | Unit | P0 |
| T-UNIT-2 | Utilização ambientes com filtros | Unit | P1 |
| T-UNIT-3 | Demanda pedagógica calcula ocupação | Unit | P0 |

---

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled

---

## Dependencies

**Depends on:**
- Stories 1.0-3.0 (todos os dados base) — ✅ Done

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Relatórios funcionais com dados reais
- [ ] Dashboard de KPIs funcional
- [ ] Gráfico de barras funcional
- [ ] Tests passing
- [ ] `npm run typecheck` ✅
- [ ] `npm run lint` ✅

---

## Dev Agent Record

_To be populated during implementation_

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-15 | 1.0 | Story created — Sistema de Relatórios e Alertas | Morgan (PM) |

---

## QA Results

_To be populated after implementation_
