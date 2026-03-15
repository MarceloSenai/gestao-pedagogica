"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

interface AmbienteRelatorio {
  id: string;
  nome: string;
  tipo: string;
  capacidade: number | null;
  status: string;
  predios: { nome: string } | null;
  predio_id: string;
}

interface Predio {
  id: string;
  nome: string;
}

export default function UtilizacaoAmbientesPage() {
  const [data, setData] = useState<AmbienteRelatorio[]>([]);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroPredio, setFiltroPredio] = useState("");

  useEffect(() => {
    fetch("/api/predios")
      .then((r) => r.json())
      .then((d: Predio[]) => setPredios(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filtroPredio) params.set("predio_id", filtroPredio);
        const res = await fetch(`/api/relatorios/utilizacao-ambientes?${params.toString()}`);
        if (!res.ok) throw new Error("Falha ao carregar dados");
        const d: AmbienteRelatorio[] = await res.json();
        setData(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filtroPredio]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
          Utilização de Ambientes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Capacidade e status dos ambientes por prédio
        </p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={filtroPredio}
          onChange={(e) => setFiltroPredio(e.target.value)}
          className="rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
        >
          <option value="">Todos os prédios</option>
          {predios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded bg-[var(--color-primary-light)]"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-surface-dark)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                  Ambiente
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                  Prédio
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                  Capacidade
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--color-text-muted)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((amb) => {
                const isHighlight =
                  amb.status === "desativado" || amb.status === "em_manutencao";
                return (
                  <tr
                    key={amb.id}
                    className={`border-b border-[var(--color-primary-light)] ${
                      isHighlight
                        ? "bg-red-50/50 dark:bg-red-900/10"
                        : "bg-[var(--color-surface)]"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                      {amb.nome}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {amb.predios?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize">
                      {amb.tipo}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]">
                      {amb.capacidade ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={amb.status} variant="ambiente" />
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    Nenhum ambiente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
