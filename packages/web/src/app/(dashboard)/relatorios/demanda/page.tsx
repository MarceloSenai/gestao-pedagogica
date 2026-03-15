"use client";

import { useEffect, useState } from "react";

interface DemandaItem {
  curso_id: string;
  curso: string;
  turmas: number;
  alunos: number;
  vagas: number;
  ocupacao: number;
}

export default function DemandaPedagogicaPage() {
  const [data, setData] = useState<DemandaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/relatorios/demanda-pedagogica")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar dados");
        return res.json();
      })
      .then((d: DemandaItem[]) => {
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
          Demanda Pedagógica
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Turmas, vagas e ocupação por curso
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
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-surface-dark)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                    Curso
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                    Turmas
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                    Alunos
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                    Vagas
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                    Ocupação %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const isHigh = item.ocupacao > 90;
                  return (
                    <tr
                      key={item.curso_id}
                      className={`border-b border-[var(--color-primary-light)] ${
                        isHigh
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : "bg-[var(--color-surface)]"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                        {item.curso}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text)]">
                        {item.turmas}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text)]">
                        {item.alunos}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text)]">
                        {item.vagas}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          isHigh
                            ? "text-red-600"
                            : item.ocupacao > 70
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {item.ocupacao.toFixed(0)}%
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
                      Nenhum dado encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bar chart visualization */}
          {data.length > 0 && (
            <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
                Ocupação por Curso
              </h3>
              <div className="space-y-3">
                {data.map((item) => (
                  <div key={item.curso_id} className="flex items-center gap-3">
                    <span className="w-40 text-sm truncate text-[var(--color-text)]">
                      {item.curso}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`${
                          item.ocupacao > 90
                            ? "bg-red-500"
                            : item.ocupacao > 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        } h-3 rounded-full transition-all duration-500`}
                        style={{
                          width: `${Math.min(item.ocupacao, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right text-[var(--color-text-muted)]">
                      {item.ocupacao.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
