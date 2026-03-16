"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/export-button";
import type { Planejamento } from "@/types/database";

interface AlocacaoWithJoins {
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

const TURNOS = [
  { key: "manha", label: "Manha" },
  { key: "tarde", label: "Tarde" },
  { key: "noite", label: "Noite" },
];

export default function GradeVisualPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [alocacoes, setAlocacoes] = useState<AlocacaoWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Build grid: rows = ambientes, columns = turnos
  // Collect unique ambientes from alocacoes
  const ambienteMap = new Map<string, { nome: string; tipo: string; capacidade: number }>();
  for (const aloc of alocacoes) {
    if (aloc.ambiente_id && aloc.ambientes) {
      ambienteMap.set(aloc.ambiente_id, aloc.ambientes);
    }
  }
  const ambientes = Array.from(ambienteMap.entries()).sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  // Build lookup: ambiente_id + turno -> alocacao
  const grid = new Map<string, AlocacaoWithJoins>();
  for (const aloc of alocacoes) {
    if (aloc.ambiente_id && aloc.turmas) {
      const key = `${aloc.ambiente_id}:${aloc.turmas.turno}`;
      grid.set(key, aloc);
    }
  }

  return (
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
        <ExportButton targetId="print-content" />
      </div>

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
          <div className="h-3 w-3 rounded bg-gray-100 border border-gray-200" />
          <span className="text-[var(--color-text-muted)]">Vazio</span>
        </div>
      </div>

      <div id="print-content">
      {ambientes.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-text-muted)]">
          Nenhuma alocacao para exibir na grade.
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
                    const key = `${ambId}:${turno.key}`;
                    const aloc = grid.get(key);

                    if (!aloc) {
                      return (
                        <td key={turno.key} className="px-4 py-3 text-center">
                          <div className="rounded bg-gray-50 border border-gray-100 py-2 px-3 text-xs text-gray-400">
                            --
                          </div>
                        </td>
                      );
                    }

                    const isConflito = aloc.status === "conflito";
                    const bgClass = isConflito
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700";

                    return (
                      <td key={turno.key} className="px-4 py-3 text-center">
                        <div className={`rounded border py-2 px-3 text-xs font-medium ${bgClass}`}>
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
