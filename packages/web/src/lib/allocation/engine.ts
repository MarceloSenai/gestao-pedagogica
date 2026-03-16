// ============================================================
// Allocation Engine v2 — Grade Horária Granular
// Supports day×slot×room allocation with backward compatibility
// ============================================================

export interface TurmaInput {
  id: string;
  disciplina_id: string;
  docente_id: string | null;
  turno: string; // 'manha' | 'tarde' | 'noite'
  vagas: number;
  matriculas_count: number;
  requisitos_recursos: string[];
  aulas_semana: number; // how many slots per week this turma needs
}

export interface AmbienteInput {
  id: string;
  nome: string;
  tipo: string;
  capacidade: number;
  status: string;
  recurso_ids: string[];
}

export interface SlotInput {
  id: string;
  turno: string;
  ordem: number;
  hora_inicio: string;
  hora_fim: string;
  label: string;
}

export interface SlotAllocation {
  dia_semana: number;
  slot_id: string;
  ambiente_id: string;
}

export interface AllocationResult {
  turma_id: string;
  ambiente_id: string | null;
  status: "alocada" | "parcial" | "nao_alocada" | "conflito";
  motivo: string | null;
  score: number;
  horarios: SlotAllocation[];
}

// Scoring weights
const W_CAPACITY = 0.4;
const W_RESOURCE = 0.5;
const W_BASE = 0.1;

const DIAS_SEMANA = [1, 2, 3, 4, 5]; // seg-sex

/**
 * Score an ambiente for a turma (same logic as v1).
 */
function scoreAmbiente(turma: TurmaInput, amb: AmbienteInput): number {
  const alunos = turma.matriculas_count || 1;
  const capacityRatio = alunos / amb.capacidade;
  const capacityFit = capacityRatio > 1 ? 0 : capacityRatio;

  const needed = turma.requisitos_recursos;
  const available = new Set(amb.recurso_ids);
  const matched = needed.filter((r) => available.has(r)).length;
  const resourceMatch = needed.length > 0 ? matched / needed.length : 1;

  const isSpecialized = amb.tipo !== "sala";
  const needsSpecialized = needed.length > 0;
  let specBonus = 0;
  if (needsSpecialized && isSpecialized && resourceMatch > 0) specBonus = 0.1;
  if (!needsSpecialized && isSpecialized) specBonus = -0.2;

  return Math.max(0, Math.min(1, capacityFit * W_CAPACITY + resourceMatch * W_RESOURCE + specBonus + W_BASE));
}

/**
 * Build a unique key for a grid cell (dia + slot).
 */
function cellKey(dia: number, slotId: string): string {
  return `${dia}:${slotId}`;
}

/**
 * Order days to spread classes across the week.
 * Prefers days not yet used, alternating odd/even for spacing.
 */
function orderDays(usedDays: Set<number>): number[] {
  const unused = DIAS_SEMANA.filter((d) => !usedDays.has(d));
  const used = DIAS_SEMANA.filter((d) => usedDays.has(d));
  // Alternate: prefer odd days first (mon/wed/fri), then even (tue/thu)
  const sortBySpread = (arr: number[]) =>
    arr.sort((a, b) => {
      const aParity = a % 2 === 1 ? 0 : 1;
      const bParity = b % 2 === 1 ? 0 : 1;
      if (aParity !== bParity) return aParity - bParity;
      return a - b;
    });
  return [...sortBySpread(unused), ...sortBySpread(used)];
}

/**
 * Main allocation function — granular (day × slot × room).
 * If slots are provided, allocates at slot granularity.
 * If no slots provided, falls back to turno-only (v1 compat).
 */
export function runAllocation(
  turmas: TurmaInput[],
  ambientes: AmbienteInput[],
  slots?: SlotInput[],
): AllocationResult[] {
  const activeAmbientes = ambientes.filter((a) => a.status === "ativo");

  // If no slots, fall back to legacy turno-only mode
  if (!slots || slots.length === 0) {
    return runAllocationLegacy(turmas, activeAmbientes);
  }

  // --- Granular mode ---

  // Occupation grids
  // cellKey → Set<ambiente_id> (which rooms are taken)
  const roomGrid = new Map<string, Set<string>>();
  // cellKey → Set<docente_id> (which docentes are busy)
  const docenteGrid = new Map<string, Set<string>>();

  // Sort turmas: specialized first, then by matriculas desc, then by aulas_semana desc
  const sorted = [...turmas].sort((a, b) => {
    const aSpec = a.requisitos_recursos.length > 0 ? 0 : 1;
    const bSpec = b.requisitos_recursos.length > 0 ? 0 : 1;
    if (aSpec !== bSpec) return aSpec - bSpec;
    if (b.aulas_semana !== a.aulas_semana) return b.aulas_semana - a.aulas_semana;
    return b.matriculas_count - a.matriculas_count;
  });

  const results: AllocationResult[] = [];

  for (const turma of sorted) {
    const turnoSlots = slots
      .filter((s) => s.turno === turma.turno)
      .sort((a, b) => a.ordem - b.ordem);

    if (turnoSlots.length === 0) {
      results.push({
        turma_id: turma.id,
        ambiente_id: null,
        status: "nao_alocada",
        motivo: `Nenhum slot de horário configurado para turno '${turma.turno}'`,
        score: 0,
        horarios: [],
      });
      continue;
    }

    const needed = turma.aulas_semana || 1;
    const allocated: SlotAllocation[] = [];
    const usedDays = new Set<number>();
    let bestAmbienteId: string | null = null;
    let totalScore = 0;

    // For each aula needed, find a (day, slot, room) triple
    for (let i = 0; i < needed; i++) {
      let found = false;
      const orderedDias = orderDays(usedDays);

      for (const dia of orderedDias) {
        // Avoid 2 aulas on same day for same turma (unless forced)
        if (usedDays.has(dia) && orderedDias.some((d) => !usedDays.has(d))) continue;

        for (const slot of turnoSlots) {
          const key = cellKey(dia, slot.id);

          // Check docente conflict
          if (turma.docente_id) {
            const busy = docenteGrid.get(key);
            if (busy?.has(turma.docente_id)) continue;
          }

          // Find best available room
          const takenRooms = roomGrid.get(key) ?? new Set<string>();
          const candidates = activeAmbientes
            .filter((a) => !takenRooms.has(a.id))
            .filter((a) => a.capacidade >= (turma.matriculas_count || 1));

          if (candidates.length === 0) continue;

          // Score and pick best
          const scored = candidates
            .map((a) => ({ a, score: scoreAmbiente(turma, a) }))
            .sort((x, y) => y.score - x.score);

          // If turma needs specific resources, require at least partial match
          let best = scored[0];
          if (turma.requisitos_recursos.length > 0) {
            const withResources = scored.filter((c) => {
              const avail = new Set(c.a.recurso_ids);
              return turma.requisitos_recursos.some((r) => avail.has(r));
            });
            if (withResources.length > 0) best = withResources[0];
          }

          // Allocate this slot
          allocated.push({
            dia_semana: dia,
            slot_id: slot.id,
            ambiente_id: best.a.id,
          });
          totalScore += best.score;
          usedDays.add(dia);

          // Track preferred ambiente (most used)
          if (!bestAmbienteId) bestAmbienteId = best.a.id;

          // Mark grids
          if (!roomGrid.has(key)) roomGrid.set(key, new Set());
          roomGrid.get(key)!.add(best.a.id);

          if (turma.docente_id) {
            if (!docenteGrid.has(key)) docenteGrid.set(key, new Set());
            docenteGrid.get(key)!.add(turma.docente_id);
          }

          found = true;
          break; // done with this slot search for this aula
        }
        if (found) break; // done with this day search
      }
    }

    // Evaluate result
    if (allocated.length === needed) {
      results.push({
        turma_id: turma.id,
        ambiente_id: bestAmbienteId,
        status: "alocada",
        motivo: null,
        score: Math.round((totalScore / needed) * 100) / 100,
        horarios: allocated,
      });
    } else if (allocated.length > 0) {
      results.push({
        turma_id: turma.id,
        ambiente_id: bestAmbienteId,
        status: "parcial",
        motivo: `Alocadas ${allocated.length}/${needed} aulas — faltam slots ou ambientes livres`,
        score: Math.round((totalScore / needed) * 100) / 100,
        horarios: allocated,
      });
    } else {
      // Determine reason
      const anyCapacity = activeAmbientes.some((a) => a.capacidade >= (turma.matriculas_count || 1));
      let motivo = "Nenhum ambiente disponível compatível";
      if (!anyCapacity) motivo = "Nenhum ambiente com capacidade suficiente";

      // Check docente conflict
      if (turma.docente_id) {
        let allConflict = true;
        for (const dia of DIAS_SEMANA) {
          for (const slot of turnoSlots) {
            const busy = docenteGrid.get(cellKey(dia, slot.id));
            if (!busy?.has(turma.docente_id!)) { allConflict = false; break; }
          }
          if (!allConflict) break;
        }
        if (allConflict) motivo = "Docente ocupado em todos os horários disponíveis";
      }

      results.push({
        turma_id: turma.id,
        ambiente_id: null,
        status: turma.docente_id && motivo.includes("Docente") ? "conflito" : "nao_alocada",
        motivo,
        score: 0,
        horarios: [],
      });
    }
  }

  return results;
}

/**
 * Legacy turno-only allocation (backward compatibility).
 */
function runAllocationLegacy(
  turmas: TurmaInput[],
  activeAmbientes: AmbienteInput[],
): AllocationResult[] {
  const turnoAllocations = new Map<string, Set<string>>();
  const docenteTurno = new Map<string, Set<string>>();

  const sorted = [...turmas].sort((a, b) => {
    const aSpec = a.requisitos_recursos.length > 0 ? 0 : 1;
    const bSpec = b.requisitos_recursos.length > 0 ? 0 : 1;
    if (aSpec !== bSpec) return aSpec - bSpec;
    return b.matriculas_count - a.matriculas_count;
  });

  const results: AllocationResult[] = [];

  for (const turma of sorted) {
    if (turma.docente_id) {
      const dt = docenteTurno.get(turma.docente_id) ?? new Set();
      if (dt.has(turma.turno)) {
        results.push({ turma_id: turma.id, ambiente_id: null, status: "conflito", motivo: "Docente já alocado neste turno", score: 0, horarios: [] });
        continue;
      }
    }

    const taken = turnoAllocations.get(turma.turno) ?? new Set();
    const candidates = activeAmbientes
      .filter((a) => !taken.has(a.id))
      .filter((a) => a.capacidade >= (turma.matriculas_count || 1))
      .map((a) => ({ a, score: scoreAmbiente(turma, a) }))
      .filter((c) => {
        if (turma.requisitos_recursos.length > 0) {
          const avail = new Set(c.a.recurso_ids);
          return turma.requisitos_recursos.some((r) => avail.has(r)) || c.a.tipo === "sala";
        }
        return true;
      })
      .sort((x, y) => y.score - x.score);

    if (candidates.length > 0) {
      const best = candidates[0];
      results.push({ turma_id: turma.id, ambiente_id: best.a.id, status: "alocada", motivo: null, score: Math.round(best.score * 100) / 100, horarios: [] });
      if (!turnoAllocations.has(turma.turno)) turnoAllocations.set(turma.turno, new Set());
      turnoAllocations.get(turma.turno)!.add(best.a.id);
      if (turma.docente_id) {
        if (!docenteTurno.has(turma.docente_id)) docenteTurno.set(turma.docente_id, new Set());
        docenteTurno.get(turma.docente_id)!.add(turma.turno);
      }
    } else {
      const anyCapacity = activeAmbientes.some((a) => a.capacidade >= (turma.matriculas_count || 1));
      let motivo = "Nenhum ambiente disponível compatível";
      if (!anyCapacity) motivo = "Nenhum ambiente com capacidade suficiente";
      else if (taken.size === activeAmbientes.length) motivo = "Todos os ambientes ocupados neste turno";
      results.push({ turma_id: turma.id, ambiente_id: null, status: "nao_alocada", motivo, score: 0, horarios: [] });
    }
  }

  return results;
}

// --- Bottleneck Analysis (Story 10.0) ---

export interface BottleneckAnalysis {
  tipo: "capacidade" | "recurso" | "turno" | "docente";
  descricao: string;
  turmas_afetadas: string[];
  sugestao: string;
}

export function analyzeBottlenecks(
  turmas: TurmaInput[],
  ambientes: AmbienteInput[],
  results: AllocationResult[],
): BottleneckAnalysis[] {
  const unallocated = results.filter((r) => r.status !== "alocada");
  const bottlenecks: BottleneckAnalysis[] = [];

  if (unallocated.length === 0) return bottlenecks;

  const capacityIssues = unallocated.filter((r) => r.motivo?.includes("capacidade"));
  if (capacityIssues.length > 0) {
    bottlenecks.push({
      tipo: "capacidade",
      descricao: `${capacityIssues.length} turma(s) sem ambiente com capacidade suficiente`,
      turmas_afetadas: capacityIssues.map((r) => r.turma_id),
      sugestao: "Considere dividir turmas grandes ou aumentar capacidade de ambientes",
    });
  }

  const turnoCount: Record<string, number> = {};
  for (const t of turmas) turnoCount[t.turno] = (turnoCount[t.turno] || 0) + 1;
  const activeCount = ambientes.filter((a) => a.status === "ativo").length;
  for (const [turno, count] of Object.entries(turnoCount)) {
    if (count > activeCount) {
      const affected = unallocated
        .filter((r) => turmas.find((t) => t.id === r.turma_id)?.turno === turno)
        .map((r) => r.turma_id);
      if (affected.length > 0) {
        const lbl = turno === "manha" ? "Manhã" : turno === "tarde" ? "Tarde" : "Noite";
        bottlenecks.push({
          tipo: "turno",
          descricao: `Turno ${lbl}: ${count} turmas para ${activeCount} ambientes`,
          turmas_afetadas: affected,
          sugestao: `Redistribuir turmas do turno ${lbl} para outros turnos`,
        });
      }
    }
  }

  const resourceNeeded: Record<string, number> = {};
  for (const t of turmas) for (const r of t.requisitos_recursos) resourceNeeded[r] = (resourceNeeded[r] || 0) + 1;
  const resourceAvail: Record<string, number> = {};
  for (const a of ambientes.filter((a) => a.status === "ativo")) for (const r of a.recurso_ids) resourceAvail[r] = (resourceAvail[r] || 0) + 1;
  for (const [recId, needed] of Object.entries(resourceNeeded)) {
    const avail = resourceAvail[recId] || 0;
    if (needed > avail) {
      bottlenecks.push({
        tipo: "recurso",
        descricao: `Recurso ${recId}: ${needed} turmas precisam, apenas ${avail} ambientes possuem`,
        turmas_afetadas: [],
        sugestao: "Adicionar recurso a mais ambientes ou flexibilizar requisitos",
      });
    }
  }

  const docenteConflicts = unallocated.filter((r) => r.motivo?.includes("Docente") || r.motivo?.includes("docente"));
  if (docenteConflicts.length > 0) {
    bottlenecks.push({
      tipo: "docente",
      descricao: `${docenteConflicts.length} turma(s) com conflito de docente`,
      turmas_afetadas: docenteConflicts.map((r) => r.turma_id),
      sugestao: "Redistribuir turmas entre docentes ou alterar turnos para evitar conflitos",
    });
  }

  return bottlenecks;
}
