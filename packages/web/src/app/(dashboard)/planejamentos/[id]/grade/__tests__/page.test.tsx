import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// --- Mocks ---
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "plan-1" }),
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}));

vi.mock("@/components/ui/toast", () => ({ toast: vi.fn() }));
vi.mock("@/components/ui/export-button", () => ({
  ExportButton: () => <button data-testid="export-btn">Export</button>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import GradeVisualPage from "../page";

const mockPlanejamento = {
  id: "plan-1",
  semestre: "1",
  ano: 2026,
  status: "rascunho",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const mockAlocacoes = [
  {
    id: "aloc-1",
    turma_id: "turma-1",
    ambiente_id: "amb-1",
    status: "alocada",
    turmas: { id: "turma-1", turno: "manha", vagas: 40, disciplinas: { nome: "Cálculo I" } },
    ambientes: { nome: "Sala 101", tipo: "sala", capacidade: 50 },
  },
  {
    id: "aloc-2",
    turma_id: "turma-2",
    ambiente_id: "amb-1",
    status: "alocada",
    turmas: { id: "turma-2", turno: "tarde", vagas: 30, disciplinas: { nome: "Física I" } },
    ambientes: { nome: "Sala 101", tipo: "sala", capacidade: 50 },
  },
];

function setupFetchMock(planejamento = mockPlanejamento, alocacoes = mockAlocacoes, horarios: unknown[] = []) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/horarios")) return Promise.resolve({ ok: true, json: () => Promise.resolve(horarios) });
    if (url.includes("/alocacoes")) return Promise.resolve({ ok: true, json: () => Promise.resolve(alocacoes) });
    if (url.includes("/planejamentos/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(planejamento) });
    return Promise.resolve({ ok: false });
  });
}

beforeEach(() => { vi.clearAllMocks(); });

describe("GradeVisualPage", () => {
  it("renders legacy grid with ambientes and turnos when no horarios", async () => {
    setupFetchMock();
    render(<GradeVisualPage />);
    await waitFor(() => { expect(screen.getByText("Sala 101")).toBeInTheDocument(); });
    expect(screen.getByText("Cálculo I")).toBeInTheDocument();
    expect(screen.getByText("Física I")).toBeInTheDocument();
  });

  it("shows legacy notice when no granular horarios", async () => {
    setupFetchMock();
    render(<GradeVisualPage />);
    await waitFor(() => {
      expect(screen.getByText(/Grade legado/)).toBeInTheDocument();
    });
  });

  it("renders granular grid when horarios exist", async () => {
    const horarios = [
      {
        id: "h-1",
        dia_semana: 1,
        slot_id: "slot-1",
        ambiente_id: "amb-1",
        alocacao_id: "aloc-1",
        alocacoes: {
          id: "aloc-1",
          turma_id: "turma-1",
          planejamento_id: "plan-1",
          status: "alocada",
          turmas: { id: "turma-1", turno: "manha", vagas: 40, docente_id: null, disciplinas: { nome: "Cálculo I" } },
        },
        slots_horario: { id: "slot-1", turno: "manha", ordem: 1, hora_inicio: "08:00:00", hora_fim: "09:40:00", label: "1º Horário" },
        ambientes: { id: "amb-1", nome: "Sala 101", tipo: "sala", capacidade: 50 },
      },
      {
        id: "h-2",
        dia_semana: 3,
        slot_id: "slot-1",
        ambiente_id: "amb-1",
        alocacao_id: "aloc-1",
        alocacoes: {
          id: "aloc-1",
          turma_id: "turma-1",
          planejamento_id: "plan-1",
          status: "alocada",
          turmas: { id: "turma-1", turno: "manha", vagas: 40, docente_id: null, disciplinas: { nome: "Cálculo I" } },
        },
        slots_horario: { id: "slot-1", turno: "manha", ordem: 1, hora_inicio: "08:00:00", hora_fim: "09:40:00", label: "1º Horário" },
        ambientes: { id: "amb-1", nome: "Sala 101", tipo: "sala", capacidade: 50 },
      },
    ];
    setupFetchMock(mockPlanejamento, mockAlocacoes, horarios);
    render(<GradeVisualPage />);

    await waitFor(() => {
      expect(screen.getByText("Grade Semanal — 1 / 2026")).toBeInTheDocument();
    });
    expect(screen.getByText("Sala 101")).toBeInTheDocument();
    expect(screen.getByText("08:00–09:40")).toBeInTheDocument();
    // Both monday and wednesday should show "Cálculo I"
    const cards = screen.getAllByText("Cálculo I");
    expect(cards.length).toBe(2);
  });

  it("shows DnD hint when rascunho with granular", async () => {
    const horarios = [{
      id: "h-1", dia_semana: 1, slot_id: "slot-1", ambiente_id: "amb-1", alocacao_id: "aloc-1",
      alocacoes: { id: "aloc-1", turma_id: "turma-1", planejamento_id: "plan-1", status: "alocada", turmas: { id: "turma-1", turno: "manha", vagas: 40, docente_id: null, disciplinas: { nome: "X" } } },
      slots_horario: { id: "slot-1", turno: "manha", ordem: 1, hora_inicio: "08:00:00", hora_fim: "09:40:00", label: "1" },
      ambientes: { id: "amb-1", nome: "S1", tipo: "sala", capacidade: 50 },
    }];
    setupFetchMock(mockPlanejamento, [], horarios);
    render(<GradeVisualPage />);
    await waitFor(() => { expect(screen.getByText(/Arraste os cards/)).toBeInTheDocument(); });
  });

  it("shows published message when published", async () => {
    setupFetchMock({ ...mockPlanejamento, status: "publicado" });
    render(<GradeVisualPage />);
    await waitFor(() => { expect(screen.getByText(/Grade legado/)).toBeInTheDocument(); });
  });

  it("renders empty state when no alocacoes", async () => {
    setupFetchMock(mockPlanejamento, []);
    render(<GradeVisualPage />);
    await waitFor(() => { expect(screen.getByText(/Nenhuma alocação/)).toBeInTheDocument(); });
  });

  it("shows error on fetch failure", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/planejamentos/")) return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    render(<GradeVisualPage />);
    await waitFor(() => { expect(screen.getByText(/Erro ao carregar/)).toBeInTheDocument(); });
  });

  it("navigates back on back button click", async () => {
    setupFetchMock();
    render(<GradeVisualPage />);
    await waitFor(() => { expect(screen.getByText("Sala 101")).toBeInTheDocument(); });
    const buttons = screen.getAllByRole("button");
    const backBtn = buttons.find((b) => b.querySelector("polyline"));
    expect(backBtn).toBeTruthy();
    fireEvent.click(backBtn!);
    expect(mockPush).toHaveBeenCalledWith("/planejamentos/plan-1");
  });
});
