import { describe, it, expect } from "vitest";
import {
  runAllocation,
  type TurmaInput,
  type AmbienteInput,
} from "../engine";

function makeTurma(overrides: Partial<TurmaInput> = {}): TurmaInput {
  return {
    id: "turma-1",
    disciplina_id: "disc-1",
    docente_id: "doc-1",
    turno: "manha",
    vagas: 40,
    matriculas_count: 30,
    requisitos_recursos: [],
    ...overrides,
  };
}

function makeAmbiente(overrides: Partial<AmbienteInput> = {}): AmbienteInput {
  return {
    id: "amb-1",
    nome: "Sala 101",
    tipo: "sala",
    capacidade: 40,
    status: "ativo",
    recurso_ids: [],
    ...overrides,
  };
}

describe("runAllocation", () => {
  it("should allocate a turma to a compatible ambiente (happy path)", () => {
    const turmas = [makeTurma()];
    const ambientes = [makeAmbiente()];

    const results = runAllocation(turmas, ambientes);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("alocada");
    expect(results[0].ambiente_id).toBe("amb-1");
    expect(results[0].turma_id).toBe("turma-1");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("should leave second turma unallocated when same turno and only 1 ambiente", () => {
    const turmas = [
      makeTurma({ id: "turma-1" }),
      makeTurma({ id: "turma-2", docente_id: "doc-2" }),
    ];
    const ambientes = [makeAmbiente()];

    const results = runAllocation(turmas, ambientes);

    expect(results).toHaveLength(2);
    const allocated = results.filter((r) => r.status === "alocada");
    const unallocated = results.filter((r) => r.status === "nao_alocada");
    expect(allocated).toHaveLength(1);
    expect(unallocated).toHaveLength(1);
    expect(unallocated[0].motivo).toBeTruthy();
  });

  it("should detect docente conflict when same docente has 2 turmas in same turno", () => {
    const turmas = [
      makeTurma({ id: "turma-1", docente_id: "doc-1" }),
      makeTurma({ id: "turma-2", docente_id: "doc-1" }),
    ];
    const ambientes = [
      makeAmbiente({ id: "amb-1" }),
      makeAmbiente({ id: "amb-2" }),
    ];

    const results = runAllocation(turmas, ambientes);

    expect(results).toHaveLength(2);
    const conflito = results.find((r) => r.status === "conflito");
    expect(conflito).toBeDefined();
    expect(conflito!.motivo).toContain("Docente");
  });

  it("should not allocate when ambiente capacity is insufficient", () => {
    const turmas = [makeTurma({ matriculas_count: 50 })];
    const ambientes = [makeAmbiente({ capacidade: 30 })];

    const results = runAllocation(turmas, ambientes);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("nao_alocada");
    expect(results[0].motivo).toContain("capacidade");
  });

  it("should prefer lab with matching resources over plain sala", () => {
    const turmas = [
      makeTurma({ requisitos_recursos: ["recurso-lab-1"] }),
    ];
    const ambientes = [
      makeAmbiente({ id: "sala-1", tipo: "sala", recurso_ids: [] }),
      makeAmbiente({
        id: "lab-1",
        tipo: "laboratorio",
        recurso_ids: ["recurso-lab-1"],
      }),
    ];

    const results = runAllocation(turmas, ambientes);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("alocada");
    expect(results[0].ambiente_id).toBe("lab-1");
  });

  it("should sort specialized turmas (with requisitos) first", () => {
    const turmas = [
      makeTurma({
        id: "turma-basic",
        docente_id: "doc-1",
        requisitos_recursos: [],
        matriculas_count: 30,
      }),
      makeTurma({
        id: "turma-specialized",
        docente_id: "doc-2",
        requisitos_recursos: ["recurso-lab-1"],
        matriculas_count: 30,
      }),
    ];
    const ambientes = [
      makeAmbiente({
        id: "lab-1",
        tipo: "laboratorio",
        capacidade: 40,
        recurso_ids: ["recurso-lab-1"],
      }),
    ];

    const results = runAllocation(turmas, ambientes);

    // Specialized turma should get the lab
    const specialized = results.find((r) => r.turma_id === "turma-specialized");
    expect(specialized!.status).toBe("alocada");
    expect(specialized!.ambiente_id).toBe("lab-1");

    // Basic turma left unallocated (only 1 ambiente, same turno)
    const basic = results.find((r) => r.turma_id === "turma-basic");
    expect(basic!.status).toBe("nao_alocada");
  });

  it("should prefer best-fit ambiente (smallest adequate room)", () => {
    const turmas = [makeTurma({ matriculas_count: 30 })];
    const ambientes = [
      makeAmbiente({ id: "big-room", capacidade: 100 }),
      makeAmbiente({ id: "small-room", capacidade: 35 }),
    ];

    const results = runAllocation(turmas, ambientes);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("alocada");
    expect(results[0].ambiente_id).toBe("small-room");
  });
});
