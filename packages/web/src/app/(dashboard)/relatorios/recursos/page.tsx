"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

interface RecursoRelatorio {
  id: string;
  nome: string;
  quantidade: number;
  status: string;
  demanda_count: number;
}

export default function RecursosRelatorioPage() {
  const [data, setData] = useState<RecursoRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/relatorios/recursos-demanda")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar dados");
        return res.json();
      })
      .then((d: RecursoRelatorio[]) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
          Recursos e Demanda
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Disponibilidade de recursos e quantidade de disciplinas que os requerem
        </p>
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
                  Recurso
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-center font-medium text-[var(--color-text-muted)]">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                  Disciplinas que Requerem
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((rec) => {
                const isUnavailable =
                  rec.status === "indisponivel" || rec.status === "em_manutencao";
                const isHighDemand = rec.demanda_count >= 3;
                const isHighlight = isUnavailable && isHighDemand;
                return (
                  <tr
                    key={rec.id}
                    className={`border-b border-[var(--color-primary-light)] ${
                      isHighlight
                        ? "bg-red-50/50 dark:bg-red-900/10"
                        : "bg-[var(--color-surface)]"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                      {rec.nome}
                      {isHighlight && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          Alta demanda + indisponível
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]">
                      {rec.quantidade}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={rec.status} variant="recurso" />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]">
                      {rec.demanda_count}
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    Nenhum recurso encontrado
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
