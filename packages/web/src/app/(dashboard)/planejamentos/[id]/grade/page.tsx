"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/export-button";
import { toast } from "@/components/ui/toast";
import type { Planejamento } from "@/types/database";

// --- Types ---

export interface HorarioEntry {
  id: string;
  dia_semana: number;
  slot_id: string;
  ambiente_id: string;
  alocacao_id: string;
  alocacoes: {
    id: string;
    turma_id: string;
    planejamento_id: string;
    status: string;
    turmas: {
      id: string;
      turno: string;
      vagas: number;
      docente_id: string | null;
      disciplinas: { nome: string } | null;
    } | null;
  } | null;
  slots_horario: {
    id: string;
    turno: string;
    ordem: number;
    hora_inicio: string;
    hora_fim: string;
    label: string;
  } | null;
  ambientes: {
    id?: string;
    nome: string;
    tipo: string;
    capacidade: number;
  } | null;
}

export interface AlocacaoLegacy {
  id: string;
  turma_id: string;
  ambiente_id: string | null;
  status: string;
  turmas: {
    id: string;
    turno: string;
    vagas: number;
    disciplinas: { nome: string } | null;
  } | null;
  ambientes: {
    nome: string;
    tipo: string;
    capacidade: number;
  } | null;
}

const DIAS = [
  { key: 1, label: "Seg" },
  { key: 2, label: "Ter" },
  { key: 3, label: "Qua" },
  { key: 4, label: "Qui" },
  { key: 5, label: "Sex" },
  { key: 6, label: "Sáb" },
];

const TURNOS_LEGACY = [
  { key: "manha", label: "Manhã" },
  { key: "tarde", label: "Tarde" },
  { key: "noite", label: "Noite" },
];

// --- Small components ---

function DraggableCard({ entry, disabled, isDragging }: { entry: HorarioEntry; disabled: boolean; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: entry.id,
    disabled,
    data: { entry },
  });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  const nome = entry.alocacoes?.turmas?.disciplinas?.nome ?? "Turma";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-testid={`horario-card-${entry.id}`}
      className={`rounded border py-1 px-2 text-[10px] font-medium bg-green-50 border-green-200 text-green-700 ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${isDragging ? "opacity-50" : ""} select-none truncate`}
      title={`${nome} — ${entry.ambientes?.nome ?? ""}`}
    >
      {nome}
    </div>
  );
}

function OverlayCard({ entry }: { entry: HorarioEntry }) {
  const nome = entry.alocacoes?.turmas?.disciplinas?.nome ?? "Turma";
  return (
    <div className="rounded border py-1 px-2 text-[10px] font-medium bg-green-50 border-green-200 text-green-700 shadow-lg cursor-grabbing select-none">
      {nome}
    </div>
  );
}

function DroppableCell({ cellId, children, disabled }: { cellId: string; children: React.ReactNode; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId, disabled });
  return (
    <td className="px-1 py-1 align-top border-r border-[var(--color-primary-light)] last:border-r-0">
      <div
        ref={setNodeRef}
        data-testid={`cell-${cellId}`}
        className={`min-h-[36px] rounded border border-dashed p-0.5 transition-colors ${isOver ? "border-blue-400 bg-blue-50" : "border-transparent"}`}
      >
        {children}
      </div>
    </td>
  );
}

// --- Main page ---

export default function GradeVisualPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [horarios, setHorarios] = useState<HorarioEntry[]>([]);
  const [legacyAlocs, setLegacyAlocs] = useState<AlocacaoLegacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<HorarioEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"ambiente" | "docente">("ambiente");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, horariosRes, alocsRes] = await Promise.all([
        fetch(`/api/planejamentos/${id}`),
        fetch(`/api/planejamentos/${id}/horarios`),
        fetch(`/api/planejamentos/${id}/alocacoes`),
      ]);
      if (!planRes.ok) throw new Error("Erro ao carregar planejamento");
      setPlanejamento(await planRes.json());
      if (horariosRes.ok) setHorarios(await horariosRes.json());
      if (alocsRes.ok) setLegacyAlocs(await alocsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isRascunho = planejamento?.status === "rascunho";
  const dndDisabled = !isRascunho || saving;
  const isGranular = horarios.length > 0;

  // --- Granular grid data ---
  const slots = new Map<string, HorarioEntry["slots_horario"]>();
  const ambienteMap = new Map<string, { nome: string; tipo: string; capacidade: number }>();

  for (const h of horarios) {
    if (h.slots_horario) slots.set(h.slots_horario.id, h.slots_horario);
    if (h.ambientes) ambienteMap.set(h.ambiente_id, h.ambientes);
  }

  const sortedSlots = [...slots.values()].sort((a, b) => {
    if (!a || !b) return 0;
    if (a.turno !== b.turno) return a.turno.localeCompare(b.turno);
    return a.ordem - b.ordem;
  });

  const ambientes = [...ambienteMap.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  // Grid: cellKey "ambId:dia:slotId" → HorarioEntry[]
  const grid = new Map<string, HorarioEntry[]>();
  for (const h of horarios) {
    const key = `${h.ambiente_id}:${h.dia_semana}:${h.slot_id}`;
    const list = grid.get(key) ?? [];
    list.push(h);
    grid.set(key, list);
  }

  // Determine days actually used
  const usedDias = new Set(horarios.map((h) => h.dia_semana));
  const diasToShow = DIAS.filter((d) => usedDias.has(d.key) || usedDias.size === 0);
  if (diasToShow.length === 0) DIAS.slice(0, 5).forEach((d) => diasToShow.push(d));

  // --- DnD handlers (placeholder for granular move) ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveEntry(event.active.data.current?.entry ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveEntry(null);
    const { active, over } = event;
    if (!over) return;
    const entry = active.data.current?.entry as HorarioEntry | undefined;
    if (!entry) return;

    const overId = String(over.id);
    // Parse target: "ambId:dia:slotId"
    const parts = overId.split(":");
    if (parts.length !== 3) return;
    const [targetAmbId, targetDiaStr, targetSlotId] = parts;
    const targetDia = Number(targetDiaStr);

    // No-op if same cell
    if (entry.ambiente_id === targetAmbId && entry.dia_semana === targetDia && entry.slot_id === targetSlotId) return;

    setSaving(true);
    // Optimistic update
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.id !== entry.id) return h;
        return {
          ...h,
          ambiente_id: targetAmbId,
          dia_semana: targetDia,
          slot_id: targetSlotId,
          ambientes: ambienteMap.get(targetAmbId) ?? h.ambientes,
        };
      })
    );

    try {
      const res = await fetch(`/api/alocacoes/${entry.alocacao_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambiente_id: targetAmbId }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao mover");
      }
      toast("Horário movido com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao mover", "error");
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-[var(--color-primary-light)]" />
        <div className="h-96 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
      </div>
    );
  }

  if (error || !planejamento) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error || "Planejamento não encontrado"}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  // --- Render granular grade ---
  if (isGranular && sortedSlots.length > 0) {
    return (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push(`/planejamentos/${id}`)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
                Grade Semanal — {planejamento.semestre} / {planejamento.ano}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {saving && <span className="text-xs text-blue-600 animate-pulse">Salvando...</span>}
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as "ambiente" | "docente")}
                className="rounded border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]"
              >
                <option value="ambiente">Por Ambiente</option>
              </select>
              <ExportButton targetId="print-content" />
            </div>
          </div>

          {isRascunho && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
              Arraste os cards entre as células para ajustar horários manualmente.
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-green-200 border border-green-300" />
              <span className="text-[var(--color-text-muted)]">Aula alocada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300" />
              <span className="text-[var(--color-text-muted)]">Destino (ao arrastar)</span>
            </div>
            <span className="text-[var(--color-text-muted)]">
              {horarios.length} horários em {ambientes.length} ambientes
            </span>
          </div>

          <div id="print-content" className="overflow-x-auto">
            {ambientes.map(([ambId, amb]) => (
              <div key={ambId} className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                  {amb.nome}
                  <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                    ({amb.tipo}, {amb.capacidade} vagas)
                  </span>
                </h3>
                <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--color-primary-light)]/60">
                        <th className="px-2 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-[var(--color-text)] w-28">
                          Horário
                        </th>
                        {diasToShow.map((d) => (
                          <th key={d.key} className="px-2 py-2 text-center text-[10px] uppercase tracking-wider font-medium text-[var(--color-text)] min-w-[100px]">
                            {d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSlots.map((slot) => {
                        if (!slot) return null;
                        return (
                          <tr key={slot.id} className="border-t border-[var(--color-primary-light)]">
                            <td className="px-2 py-1 text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                              {slot.hora_inicio.slice(0, 5)}–{slot.hora_fim.slice(0, 5)}
                            </td>
                            {diasToShow.map((d) => {
                              const cellId = `${ambId}:${d.key}:${slot.id}`;
                              const entries = grid.get(cellId) ?? [];
                              return (
                                <DroppableCell key={d.key} cellId={cellId} disabled={dndDisabled}>
                                  {entries.length === 0 ? (
                                    <div className="text-[9px] text-gray-300 text-center">—</div>
                                  ) : (
                                    entries.map((e) => (
                                      <DraggableCard key={e.id} entry={e} disabled={dndDisabled} isDragging={activeEntry?.id === e.id} />
                                    ))
                                  )}
                                </DroppableCell>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeEntry ? <OverlayCard entry={activeEntry} /> : null}
        </DragOverlay>
      </DndContext>
    );
  }

  // --- Fallback: legacy turno-only grid ---
  const legacyAmbMap = new Map<string, { nome: string; tipo: string; capacidade: number }>();
  for (const a of legacyAlocs) {
    if (a.ambiente_id && a.ambientes) legacyAmbMap.set(a.ambiente_id, a.ambientes);
  }
  const legacyAmbientes = [...legacyAmbMap.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome));
  const legacyGrid = new Map<string, AlocacaoLegacy>();
  for (const a of legacyAlocs) {
    if (a.ambiente_id && a.turmas) legacyGrid.set(`${a.ambiente_id}:${a.turmas.turno}`, a);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/planejamentos/${id}`)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
            Grade Visual — {planejamento.semestre} / {planejamento.ano}
          </h1>
        </div>
        <ExportButton targetId="print-content" />
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
        Grade legado (por turno). Configure slots de horário em Configurações para ativar a grade semanal granular.
      </div>

      <div id="print-content">
        {legacyAmbientes.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-text-muted)]">
            Nenhuma alocação para exibir.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)] shadow-sm bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)] min-w-[180px]">Ambiente</th>
                  {TURNOS_LEGACY.map((t) => (
                    <th key={t.key} className="px-4 py-3 text-center text-xs uppercase tracking-wider font-medium text-[var(--color-text)] min-w-[200px]">{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legacyAmbientes.map(([ambId, amb]) => (
                  <tr key={ambId} className="border-b border-[var(--color-primary-light)] last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {amb.nome}
                      <span className="ml-1 text-xs text-[var(--color-text-muted)]">({amb.tipo}, {amb.capacidade} vagas)</span>
                    </td>
                    {TURNOS_LEGACY.map((turno) => {
                      const aloc = legacyGrid.get(`${ambId}:${turno.key}`);
                      if (!aloc) return <td key={turno.key} className="px-4 py-3 text-center"><div className="rounded bg-gray-50 border border-gray-100 py-2 px-3 text-xs text-gray-400">--</div></td>;
                      return (
                        <td key={turno.key} className="px-4 py-3 text-center">
                          <div className="rounded border py-2 px-3 text-xs font-medium bg-green-50 border-green-200 text-green-700">
                            {aloc.turmas?.disciplinas?.nome ?? "Turma"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
