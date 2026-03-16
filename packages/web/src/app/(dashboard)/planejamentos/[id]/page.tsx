"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExportButton } from "@/components/ui/export-button";
import { toast } from "@/components/ui/toast";
import { confirm } from "@/components/ui/confirm-dialog";
import type { Planejamento, AlteracaoExtraordinaria } from "@/types/database";
import type { BottleneckAnalysis } from "@/lib/allocation/engine";

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

interface TurmaOption {
  id: string;
  label: string;
}

interface AmbienteOption {
  id: string;
  label: string;
}

const turnoLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

const tipoAlteracaoLabels: Record<string, string> = {
  adicionar: "Adicionar",
  remover: "Remover",
  modificar: "Modificar",
};

export default function PlanejamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [alocacoes, setAlocacoes] = useState<AlocacaoWithJoins[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>([]);
  const [alteracoes, setAlteracoes] = useState<AlteracaoExtraordinaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Alteracao modal state
  const [showAlteracaoModal, setShowAlteracaoModal] = useState(false);
  const [alteracaoForm, setAlteracaoForm] = useState({
    tipo: "modificar" as string,
    descricao: "",
    justificativa: "",
    turma_id: "",
    ambiente_novo_id: "",
  });
  const [submittingAlteracao, setSubmittingAlteracao] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Options for selects
  const [turmaOptions, setTurmaOptions] = useState<TurmaOption[]>([]);
  const [ambienteOptions, setAmbienteOptions] = useState<AmbienteOption[]>([]);

  const fetchAlteracoes = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch(`/api/planejamentos/${id}/alteracoes`, { signal });
    if (res.ok) setAlteracoes(await res.json());
  }, [id]);

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, alocRes, resumoRes] = await Promise.all([
        fetch(`/api/planejamentos/${id}`, { signal }),
        fetch(`/api/planejamentos/${id}/alocacoes`, { signal }),
        fetch(`/api/planejamentos/${id}/resumo`, { signal }),
      ]);

      if (!planRes.ok) throw new Error("Erro ao carregar planejamento");
      setPlanejamento(await planRes.json());

      if (alocRes.ok) setAlocacoes(await alocRes.json());
      if (resumoRes.ok) setResumo(await resumoRes.json());

      await fetchAlteracoes(signal);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [id, fetchAlteracoes]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll]);

  // Build turma/ambiente options from alocacoes
  useEffect(() => {
    const turmas: TurmaOption[] = alocacoes
      .filter((a) => a.turmas)
      .map((a) => ({
        id: a.turma_id,
        label: `${a.turmas?.disciplinas?.nome ?? "Turma"} - ${turnoLabels[a.turmas?.turno ?? ""] ?? a.turmas?.turno}`,
      }));
    // Deduplicate
    const seen = new Set<string>();
    setTurmaOptions(turmas.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    }));

    const ambientes: AmbienteOption[] = alocacoes
      .filter((a) => a.ambientes)
      .map((a) => ({
        id: a.ambiente_id!,
        label: `${a.ambientes!.nome} (${a.ambientes!.tipo})`,
      }));
    const seenAmb = new Set<string>();
    setAmbienteOptions(ambientes.filter((a) => {
      if (seenAmb.has(a.id)) return false;
      seenAmb.add(a.id);
      return true;
    }));
  }, [alocacoes]);

  const handleExecutar = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/planejamentos/${id}/executar`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao executar alocação");
      }
      const data = await res.json();
      // Store bottlenecks from execution response
      if (data.bottlenecks) {
        setBottlenecks(data.bottlenecks);
      }
      await fetchAll();
      toast("Alocação executada com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao executar", "error");
    } finally {
      setExecuting(false);
    }
  };

  const handlePublicar = async () => {
    const ok = await confirm({
      message: "Publicar este planejamento? Após a publicação, edições diretas serão bloqueadas. Apenas Ordens de Alteração Extraordinária serão permitidas.",
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

  const handleSubmitAlteracao = async () => {
    if (!alteracaoForm.descricao || !alteracaoForm.justificativa) {
      toast("Preencha descrição e justificativa", "warning");
      return;
    }
    setSubmittingAlteracao(true);
    try {
      const res = await fetch(`/api/planejamentos/${id}/alteracoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: alteracaoForm.tipo,
          descricao: alteracaoForm.descricao,
          justificativa: alteracaoForm.justificativa,
          turma_id: alteracaoForm.turma_id || null,
          ambiente_novo_id: alteracaoForm.ambiente_novo_id || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao criar alteração");
      }
      toast("Alteração extraordinária criada", "success");
      setShowAlteracaoModal(false);
      setAlteracaoForm({ tipo: "modificar", descricao: "", justificativa: "", turma_id: "", ambiente_novo_id: "" });
      await fetchAlteracoes();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro", "error");
    } finally {
      setSubmittingAlteracao(false);
    }
  };

  const handleAlteracaoAction = async (alteracaoId: string, status: "aprovada" | "rejeitada") => {
    setApprovingId(alteracaoId);
    try {
      const res = await fetch(`/api/planejamentos/${id}/alteracoes/${alteracaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao atualizar alteracao");
      }
      toast(`Alteracao ${status}`, "success");
      await fetchAlteracoes();
      await fetchAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro", "error");
    } finally {
      setApprovingId(null);
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
  const isPublicado = planejamento.status === "publicado";
  const hasAlocacoes = alocacoes.length > 0;

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
          <ExportButton targetId="print-content" />
          {isRascunho && (
            <Button variant="primary" onClick={handleExecutar} loading={executing}>
              {executing ? "Executando..." : "Executar Alocação"}
            </Button>
          )}
          {isRascunho && hasAlocacoes && (
            <Button variant="secondary" onClick={handlePublicar} loading={publishing}>
              Publicar
            </Button>
          )}
          {isPublicado && (
            <Button variant="primary" onClick={() => setShowAlteracaoModal(true)}>
              Nova Alteração Extraordinária
            </Button>
          )}
          {hasAlocacoes && (
            <Link href={`/planejamentos/${id}/grade`}>
              <Button variant="secondary">
                Ver Grade
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div id="print-content">
      {/* Published lock banner */}
      {isPublicado && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="font-medium text-blue-800">Planejamento publicado</span>
          </div>
          <p className="mt-1 text-sm text-blue-700">
            Edições diretas estão bloqueadas. Para realizar alterações, utilize uma Ordem de Alteração Extraordinária.
          </p>
        </div>
      )}

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
            <p className="text-xs font-medium uppercase tracking-wide text-red-600">Nao Alocadas</p>
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

      {/* Modo Consultivo - Bottleneck Analysis (Story 10.0) */}
      {bottlenecks.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="font-[family-name:var(--font-space-grotesk)] font-semibold text-yellow-800">
            Modo Consultivo — Gargalos Identificados
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            O algoritmo não conseguiu alocar 100% das turmas. Veja os gargalos identificados e sugestões para resolução.
          </p>
          {bottlenecks.map((b, i) => (
            <div key={i} className="mt-3 rounded border border-yellow-300 bg-white p-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={b.tipo} variant="bottleneck" />
                <span className="font-medium text-[var(--color-text)]">{b.descricao}</span>
              </div>
              <p className="mt-1 text-sm text-yellow-700">Sugestão: {b.sugestao}</p>
              {b.turmas_afetadas.length > 0 && (
                <p className="mt-1 text-xs text-yellow-600">
                  Turmas afetadas: {b.turmas_afetadas.length}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alocacoes Table */}
      {alocadas.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)] mb-3">
            Alocacoes
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

      {/* Nao Alocadas */}
      {naoAlocadas.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-red-700 mb-3">
            Nao Alocadas / Conflitos
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

      {/* Alteracoes Extraordinarias (Story 11.0) */}
      {isPublicado && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)] mb-3">
            Ordens de Alteração Extraordinária
          </h2>
          {alteracoes.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-6 text-center">
              <p className="text-[var(--color-text-muted)]">
                Nenhuma alteração extraordinária registrada.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alteracoes.map((alt) => (
                <div key={alt.id} className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alt.status} variant="alteracao" />
                      <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
                        {tipoAlteracaoLabels[alt.tipo] ?? alt.tipo}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(alt.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--color-text)]">{alt.descricao}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Justificativa: {alt.justificativa}
                  </p>
                  {alt.status === "pendente" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAlteracaoAction(alt.id, "aprovada")}
                        loading={approvingId === alt.id}
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlteracaoAction(alt.id, "rejeitada")}
                        loading={approvingId === alt.id}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasAlocacoes && (
        <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-30">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
          </svg>
          <p className="text-[var(--color-text-muted)]">
            Nenhuma alocação realizada. Clique em &quot;Executar Alocação&quot; para iniciar.
          </p>
        </div>
      )}
      </div>

      {/* Modal: Nova Alteração Extraordinária */}
      {showAlteracaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-[var(--color-surface)] p-6 shadow-xl">
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)]">
              Nova Alteração Extraordinária
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Registre uma ordem de alteracao para este planejamento publicado.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">Tipo</label>
                <select
                  value={alteracaoForm.tipo}
                  onChange={(e) => setAlteracaoForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                >
                  <option value="modificar">Modificar alocação</option>
                  <option value="adicionar">Adicionar alocação</option>
                  <option value="remover">Remover alocação</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">Turma (opcional)</label>
                <select
                  value={alteracaoForm.turma_id}
                  onChange={(e) => setAlteracaoForm((f) => ({ ...f, turma_id: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                >
                  <option value="">-- Selecione --</option>
                  {turmaOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {(alteracaoForm.tipo === "modificar" || alteracaoForm.tipo === "adicionar") && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)]">Novo Ambiente (opcional)</label>
                  <select
                    value={alteracaoForm.ambiente_novo_id}
                    onChange={(e) => setAlteracaoForm((f) => ({ ...f, ambiente_novo_id: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    <option value="">-- Selecione --</option>
                    {ambienteOptions.map((a) => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">Descricao *</label>
                <textarea
                  value={alteracaoForm.descricao}
                  onChange={(e) => setAlteracaoForm((f) => ({ ...f, descricao: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                  placeholder="Descreva a alteração necessária"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">Justificativa *</label>
                <textarea
                  value={alteracaoForm.justificativa}
                  onChange={(e) => setAlteracaoForm((f) => ({ ...f, justificativa: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                  placeholder="Justifique a necessidade desta alteração extraordinária"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAlteracaoModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSubmitAlteracao} loading={submittingAlteracao}>
                Criar Alteração
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
