"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { confirm } from "@/components/ui/confirm-dialog";
import type { Planejamento } from "@/types/database";

interface AlocacaoWithJoins {
  id: string;
  planejamento_id: string;
  turma_id: string;
  ambiente_id: string | null;
  status: string;
  motivo: string | null;
  score: number;
  created_at: string;
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

interface Resumo {
  total: number;
  alocadas: number;
  nao_alocadas: number;
  conflitos: number;
  taxa_sucesso: number;
}

const turnoLabels: Record<string, string> = {
  manha: "Manha",
  tarde: "Tarde",
  noite: "Noite",
};

export default function PlanejamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [alocacoes, setAlocações] = useState<AlocacaoWithJoins[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, alocRes, resumoRes] = await Promise.all([
        fetch(`/api/planejamentos/${id}`),
        fetch(`/api/planejamentos/${id}/alocacoes`),
        fetch(`/api/planejamentos/${id}/resumo`),
      ]);

      if (!planRes.ok) throw new Error("Erro ao carregar planejamento");
      setPlanejamento(await planRes.json());

      if (alocRes.ok) setAlocações(await alocRes.json());
      if (resumoRes.ok) setResumo(await resumoRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExecutar = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/planejamentos/${id}/executar`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao executar alocacao");
      }
      await fetchAll();
      toast("Alocacao executada com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao executar", "error");
    } finally {
      setExecuting(false);
    }
  };

  const handlePublicar = async () => {
    const ok = await confirm({
      message: "Publicar este planejamento? Esta ação não pode ser desfeita.",
      confirmLabel: "Publicar",
      variant: "primary",
    });
    if (!ok) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/planejamentos/${id}/publicar`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao publicar");
      }
      await fetchAll();
      toast("Planejamento publicado com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao publicar", "error");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-[var(--color-primary-light)]" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
      </div>
    );
  }

  if (error || !planejamento) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error || "Planejamento não encontrado"}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => router.push("/planejamentos")}>
          Voltar
        </Button>
      </div>
    );
  }

  const isRascunho = planejamento.status === "rascunho";
  const hasAlocações = alocacoes.length > 0;

  const alocadas = alocacoes.filter((a) => a.status === "alocada");
  const naoAlocadas = alocacoes.filter((a) => a.status === "nao_alocada" || a.status === "conflito");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/planejamentos")}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
              Planejamento {planejamento.semestre} / {planejamento.ano}
            </h1>
            <StatusBadge status={planejamento.status} variant="planejamento" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRascunho && (
            <Button variant="primary" onClick={handleExecutar} loading={executing}>
              {executing ? "Executando..." : "Executar Alocacao"}
            </Button>
          )}
          {isRascunho && hasAlocações && (
            <Button variant="secondary" onClick={handlePublicar} loading={publishing}>
              Publicar
            </Button>
          )}
          {hasAlocações && (
            <Link href={`/planejamentos/${id}/grade`}>
              <Button variant="secondary">
                Ver Grade
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {resumo && resumo.total > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Total Turmas</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{resumo.total}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-green-600">Alocadas</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{resumo.alocadas}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-red-600">Não Alocadas</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{resumo.nao_alocadas}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-yellow-600">Conflitos</p>
            <p className="mt-1 text-2xl font-bold text-yellow-700">{resumo.conflitos}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Taxa Sucesso</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{resumo.taxa_sucesso}%</p>
          </div>
        </div>
      )}

      {/* Alocações Table */}
      {alocadas.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)] mb-3">
            Alocações
          </h2>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)] shadow-sm bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">Disciplina</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">Turno</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">Ambiente</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">Score</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {alocadas.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-accent-light)]/40 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {item.turmas?.disciplinas?.nome ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {item.turmas ? (turnoLabels[item.turmas.turno] ?? item.turmas.turno) : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {item.ambientes?.nome ?? "\u2014"}
                      {item.ambientes?.tipo && (
                        <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                          ({item.ambientes.tipo})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} variant="alocacao" />
                    </td>
                    <td className="px-4 py-3">{item.score}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{item.motivo ?? "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Não Alocadas */}
      {naoAlocadas.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-red-700 mb-3">
            Não Alocadas / Conflitos
          </h2>
          <div className="overflow-x-auto rounded-lg border border-red-200 shadow-sm bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-200 bg-red-50">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-red-700">Disciplina</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-red-700">Turno</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-red-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-red-700">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {naoAlocadas.map((item) => (
                  <tr key={item.id} className="border-b border-red-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {item.turmas?.disciplinas?.nome ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {item.turmas ? (turnoLabels[item.turmas.turno] ?? item.turmas.turno) : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} variant="alocacao" />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{item.motivo ?? "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAlocações && (
        <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-30">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
          </svg>
          <p className="text-[var(--color-text-muted)]">
            Nenhuma alocacao realizada. Clique em &quot;Executar Alocacao&quot; para iniciar.
          </p>
        </div>
      )}
    </div>
  );
}
