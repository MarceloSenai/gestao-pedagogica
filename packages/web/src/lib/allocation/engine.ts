export interface TurmaInput {
  id: string;
  disciplina_id: string;
  docente_id: string | null;
  turno: string; // 'manha' | 'tarde' | 'noite'
  vagas: number;
  matriculas_count: number;
  requisitos_recursos: string[]; // recurso_ids needed
}

export interface AmbienteInput {
  id: string;
  nome: string;
  tipo: string; // 'sala' | 'laboratorio' | 'auditorio' | 'oficina'
  capacidade: number;
  status: string;
  recurso_ids: string[]; // recurso_ids available
}

export interface AllocationResult {
  turma_id: string;
  ambiente_id: string | null;
  status: "alocada" | "nao_alocada" | "conflito";
  motivo: string | null;
  score: number;
}

export function runAllocation(
  turmas: TurmaInput[],
  ambientes: AmbienteInput[],
): AllocationResult[] {
  // Filter only active ambientes
  const activeAmbientes = ambientes.filter((a) => a.status === "ativo");

  // Track which ambientes are taken per turno
  const turnoAllocations: Map<string, Set<string>> = new Map(); // turno -> Set<ambiente_id>
  const docenteTurno: Map<string, Set<string>> = new Map(); // docente_id -> Set<turno>

  // Sort turmas: specialized (with requisitos) first, then by matriculas desc
  const sorted = [...turmas].sort((a, b) => {
    // Specialized first (FR-34)
    const aSpec = a.requisitos_recursos.length > 0 ? 0 : 1;
    const bSpec = b.requisitos_recursos.length > 0 ? 0 : 1;
    if (aSpec !== bSpec) return aSpec - bSpec;
    // Larger classes first
    return b.matriculas_count - a.matriculas_count;
  });

  const results: AllocationResult[] = [];

  for (const turma of sorted) {
    // Check docente conflict
    if (turma.docente_id) {
      const docenteTurnos = docenteTurno.get(turma.docente_id) ?? new Set();
      if (docenteTurnos.has(turma.turno)) {
        results.push({
          turma_id: turma.id,
          ambiente_id: null,
          status: "conflito",
          motivo: "Docente já alocado neste turno",
          score: 0,
        });
        continue;
      }
    }

    // Get ambientes already taken this turno
    const takenInTurno = turnoAllocations.get(turma.turno) ?? new Set();

    // Find compatible ambientes
    const candidates = activeAmbientes
      .filter((a) => !takenInTurno.has(a.id)) // Not taken this turno (FR-28)
      .filter((a) => a.capacidade >= turma.matriculas_count) // Capacity check (FR-36)
      .map((a) => {
        // Score calculation
        const alunos = turma.matriculas_count || 1;

        // Capacity fit: prefer smallest adequate room (best-fit, FR-36)
        const capacityRatio = alunos / a.capacidade;
        const capacityFit = capacityRatio > 1 ? 0 : capacityRatio; // 0 if over, closer to 1 = better fit

        // Resource match (FR-34)
        const needed = turma.requisitos_recursos;
        const available = new Set(a.recurso_ids);
        const matched = needed.filter((r) => available.has(r)).length;
        const resourceMatch = needed.length > 0 ? matched / needed.length : 1;

        // Specialization bonus: if turma needs specialized room and this IS one (FR-37)
        const isSpecialized = a.tipo !== "sala";
        const needsSpecialized = needed.length > 0;
        let specBonus = 0;
        if (needsSpecialized && isSpecialized && resourceMatch > 0)
          specBonus = 0.1;
        if (!needsSpecialized && isSpecialized) specBonus = -0.2; // Penalize using lab for basic class

        const score = capacityFit * 0.4 + resourceMatch * 0.5 + specBonus + 0.1; // base 0.1
        return { ambiente: a, score: Math.max(0, Math.min(1, score)) };
      })
      .filter((c) => {
        // If turma has requisitos, require at least partial match
        if (turma.requisitos_recursos.length > 0) {
          const available = new Set(c.ambiente.recurso_ids);
          const hasAny = turma.requisitos_recursos.some((r) =>
            available.has(r),
          );
          return hasAny || c.ambiente.tipo === "sala"; // Allow fallback to sala
        }
        return true;
      })
      .sort((a, b) => b.score - a.score); // Best score first

    if (candidates.length > 0) {
      const best = candidates[0];
      results.push({
        turma_id: turma.id,
        ambiente_id: best.ambiente.id,
        status: "alocada",
        motivo: null,
        score: Math.round(best.score * 100) / 100,
      });

      // Mark ambiente as taken for this turno
      if (!turnoAllocations.has(turma.turno))
        turnoAllocations.set(turma.turno, new Set());
      turnoAllocations.get(turma.turno)!.add(best.ambiente.id);

      // Mark docente turno
      if (turma.docente_id) {
        if (!docenteTurno.has(turma.docente_id))
          docenteTurno.set(turma.docente_id, new Set());
        docenteTurno.get(turma.docente_id)!.add(turma.turno);
      }
    } else {
      // Determine reason (FR-35)
      const anyCapacity = activeAmbientes.some(
        (a) => a.capacidade >= turma.matriculas_count,
      );
      let motivo = "Nenhum ambiente disponível compatível";
      if (!anyCapacity) motivo = "Nenhum ambiente com capacidade suficiente";
      else if (takenInTurno.size === activeAmbientes.length)
        motivo = "Todos os ambientes ocupados neste turno";

      results.push({
        turma_id: turma.id,
        ambiente_id: null,
        status: "nao_alocada",
        motivo,
        score: 0,
      });
    }
  }

  return results;
}
