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

export interface AlocacaoWithJoins {
  id: string;
  turma_id: string;
  ambiente_id: string | null;
  status: string;
  score: number;
  motivo: string | null;
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

const TURNOS = [
  { key: "manha", label: "Manhã" },
  { key: "tarde", label: "Tarde" },
  { key: "noite", label: "Noite" },
];

// --- Draggable card ---
function DraggableCard({
  aloc,
  isDragging,
  disabled,
}: {
  aloc: AlocacaoWithJoins;
  isDragging?: boolean;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: aloc.id,
    disabled,
    data: { aloc },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const isConflito = aloc.status === "conflito";
  const bgClass = isConflito
    ? "bg-red-50 border-red-200 text-red-700"
    : "bg-green-50 border-green-200 text-green-700";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-testid={`alocacao-card-${aloc.id}`}
      className={`rounded border py-2 px-3 text-xs font-medium ${bgClass} ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-50" : ""} select-none`}
    >
      <div className="truncate">{aloc.turmas?.disciplinas?.nome ?? "Turma"}</div>
      <div className="mt-0.5 text-[10px] opacity-70">
        {aloc.turmas?.vagas ?? 0} vagas
      </div>
    </div>
  );
}

// --- Static card for DragOverlay ---
function OverlayCard({ aloc }: { aloc: AlocacaoWithJoins }) {
  const isConflito = aloc.status === "conflito";
  const bgClass = isConflito
    ? "bg-red-50 border-red-200 text-red-700"
    : "bg-green-50 border-green-200 text-green-700";

  return (
    <div
      className={`rounded border py-2 px-3 text-xs font-medium ${bgClass} shadow-lg cursor-grabbing select-none`}
    >
      <div className="truncate">{aloc.turmas?.disciplinas?.nome ?? "Turma"}</div>
      <div className="mt-0.5 text-[10px] opacity-70">
        {aloc.turmas?.vagas ?? 0} vagas
      </div>
    </div>
  );
}

// --- Droppable cell ---
function DroppableCell({
  cellId,
  children,
  isOver,
  disabled,
}: {
  cellId: string;
  children: React.ReactNode;
  isOver: boolean;
  disabled: boolean;
}) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: cellId,
    disabled,
  });

  const highlight = isOver || dndIsOver;

  return (
    <td className="px-2 py-2 text-center align-top">
      <div
        ref={setNodeRef}
        data-testid={`cell-${cellId}`}
        className={`min-h-[60px] rounded-lg border-2 border-dashed p-1.5 transition-colors ${
          highlight
            ? "border-blue-400 bg-blue-50"
            : "border-transparent"
        }`}
      >
        {children}
      </div>
    </td>
  );
}

// --- Unallocated pool ---
function UnallocatedPool({
  alocacoes,
  disabled,
}: {
  alocacoes: AlocacaoWithJoins[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "pool-unallocated",
    disabled,
  });

  if (alocacoes.length === 0 && disabled) return null;

  return (
    <div
      ref={setNodeRef}
      data-testid="pool-unallocated"
      className={`rounded-lg border-2 border-dashed p-3 transition-colors ${
        isOver ? "border-orange-400 bg-orange-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Não Alocadas ({alocacoes.length})
      </h3>
      {alocacoes.length === 0 ? (
        <p className="text-xs text-gray-400">
          {disabled ? "Nenhuma turma sem alocação." : "Arraste cards aqui para desalocar."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {alocacoes.map((aloc) => (
            <DraggableCard key={aloc.id} aloc={aloc} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main page ---
export default function GradeVisualPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [alocacoes, setAlocacoes] = useState<AlocacaoWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAloc, setActiveAloc] = useState<AlocacaoWithJoins | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, alocRes] = await Promise.all([
        fetch(`/api/planejamentos/${id}`),
        fetch(`/api/planejamentos/${id}/alocacoes`),
      ]);
      if (!planRes.ok) throw new Error("Erro ao carregar planejamento");
      setPlanejamento(await planRes.json());
      if (alocRes.ok) setAlocacoes(await alocRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isRascunho = planejamento?.status === "rascunho";
  const dndDisabled = !isRascunho || saving;

  // Build grid data
  const ambienteMap = new Map<string, { nome: string; tipo: string; capacidade: number }>();
  for (const aloc of alocacoes) {
    if (aloc.ambiente_id && aloc.ambientes) {
      ambienteMap.set(aloc.ambiente_id, aloc.ambientes);
    }
  }
  const ambientes = Array.from(ambienteMap.entries()).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  // Grid: ambiente_id:turno -> alocacoes[]
  const grid = new Map<string, AlocacaoWithJoins[]>();
  for (const aloc of alocacoes) {
    if (aloc.ambiente_id && aloc.turmas) {
      const key = `${aloc.ambiente_id}:${aloc.turmas.turno}`;
      const list = grid.get(key) ?? [];
      list.push(aloc);
      grid.set(key, list);
    }
  }

  const unallocated = alocacoes.filter((a) => !a.ambiente_id);

  // --- DnD handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const aloc = event.active.data.current?.aloc as AlocacaoWithJoins | undefined;
    setActiveAloc(aloc ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveAloc(null);
    const { active, over } = event;
    if (!over) return;

    const draggedAloc = active.data.current?.aloc as AlocacaoWithJoins | undefined;
    if (!draggedAloc) return;

    const overId = String(over.id);

    // Determine target ambiente_id from droppable id
    let targetAmbienteId: string | null = null;
    if (overId === "pool-unallocated") {
      targetAmbienteId = null;
    } else {
      // Format: "ambienteId:turno"
      const [ambId] = overId.split(":");
      targetAmbienteId = ambId;
    }

    // No-op if same ambiente
    if (draggedAloc.ambiente_id === targetAmbienteId) return;

    // Optimistic update
    setSaving(true);
    setAlocacoes((prev) =>
      prev.map((a) => {
        if (a.id !== draggedAloc.id) return a;
        const newAmbientes = targetAmbienteId
          ? ambienteMap.get(targetAmbienteId) ?? null
          : null;
        return {
          ...a,
          ambiente_id: targetAmbienteId,
          ambientes: newAmbientes,
          status: targetAmbienteId ? "alocada" : "nao_alocada",
        };
      })
    );

    try {
      const res = await fetch(`/api/alocacoes/${draggedAloc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambiente_id: targetAmbienteId }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao mover alocação");
      }
      toast(
        targetAmbienteId
          ? "Alocação movida com sucesso"
          : "Alocação removida (desalocada)",
        "success"
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao mover", "error");
      // Rollback: refetch
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
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/planejamentos/${id}`)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
              Grade Visual — {planejamento.semestre} / {planejamento.ano}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-blue-600 animate-pulse">Salvando...</span>
            )}
            <ExportButton targetId="print-content" />
          </div>
        </div>

        {/* DnD hint */}
        {isRascunho && alocacoes.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            Arraste os cards entre as células para ajustar alocações manualmente.
          </div>
        )}
        {!isRascunho && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Planejamento publicado — arrastar desabilitado.
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-green-200 border border-green-300" />
            <span className="text-[var(--color-text-muted)]">Alocada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-red-200 border border-red-300" />
            <span className="text-[var(--color-text-muted)]">Conflito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300" />
            <span className="text-[var(--color-text-muted)]">Destino (ao arrastar)</span>
          </div>
        </div>

        {/* Unallocated pool */}
        <UnallocatedPool alocacoes={unallocated} disabled={dndDisabled} />

        <div id="print-content">
          {ambientes.length === 0 && unallocated.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-text-muted)]">
              Nenhuma alocação para exibir na grade.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)] shadow-sm bg-[var(--color-surface)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)] min-w-[180px]">
                      Ambiente
                    </th>
                    {TURNOS.map((turno) => (
                      <th
                        key={turno.key}
                        className="px-4 py-3 text-center text-xs uppercase tracking-wider font-medium text-[var(--color-text)] min-w-[200px]"
                      >
                        {turno.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ambientes.map(([ambId, amb]) => (
                    <tr key={ambId} className="border-b border-[var(--color-primary-light)] last:border-b-0">
                      <td className="px-4 py-3 font-medium">
                        {amb.nome}
                        <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                          ({amb.tipo}, {amb.capacidade} vagas)
                        </span>
                      </td>
                      {TURNOS.map((turno) => {
                        const cellId = `${ambId}:${turno.key}`;
                        const cellAlocs = grid.get(cellId) ?? [];

                        return (
                          <DroppableCell
                            key={turno.key}
                            cellId={cellId}
                            isOver={false}
                            disabled={dndDisabled}
                          >
                            {cellAlocs.length === 0 ? (
                              <div className="rounded bg-gray-50 border border-gray-100 py-2 px-3 text-xs text-gray-400">
                                --
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {cellAlocs.map((aloc) => (
                                  <DraggableCard
                                    key={aloc.id}
                                    aloc={aloc}
                                    isDragging={activeAloc?.id === aloc.id}
                                    disabled={dndDisabled}
                                  />
                                ))}
                              </div>
                            )}
                          </DroppableCell>
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

      {/* Drag overlay — renders outside normal flow for smooth dragging */}
      <DragOverlay dropAnimation={null}>
        {activeAloc ? <OverlayCard aloc={activeAloc} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
