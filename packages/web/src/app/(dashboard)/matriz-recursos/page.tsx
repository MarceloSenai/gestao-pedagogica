"use client";

import { useEffect, useState } from "react";
import type { Disciplina, Recurso } from "@/types/database";

interface MatrizEntry {
  disciplina_id: string;
  recurso_id: string;
  quantidade: number;
}

export default function MatrizRecursosPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [matriz, setMatriz] = useState<MatrizEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [matrizRes, discRes, recRes] = await Promise.all([
          fetch("/api/matriz-recursos"),
          fetch("/api/disciplinas"),
          fetch("/api/recursos"),
        ]);
        if (!matrizRes.ok) throw new Error("Erro ao carregar matriz de recursos");
        if (!discRes.ok) throw new Error("Erro ao carregar disciplinas");
        if (!recRes.ok) throw new Error("Erro ao carregar recursos");

        setMatriz(await matrizRes.json());
        setDisciplinas(await discRes.json());
        setRecursos(await recRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const matrizMap = new Map<string, number>();
  for (const entry of matriz) {
    matrizMap.set(`${entry.disciplina_id}:${entry.recurso_id}`, entry.quantidade);
  }

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">Matriz de Recursos</h1>

      {disciplinas.length === 0 || recursos.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">
          Nenhum dado disponível. Cadastre disciplinas e recursos primeiro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--color-primary-light)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text)] sticky left-0 bg-[var(--color-primary-light)]">
                  Disciplina
                </th>
                {recursos.map((r) => (
                  <th
                    key={r.id}
                    className="px-4 py-3 text-center font-medium text-[var(--color-text)] whitespace-nowrap"
                  >
                    {r.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium sticky left-0 bg-[var(--color-surface)]">
                    {d.nome}
                  </td>
                  {recursos.map((r) => {
                    const qty = matrizMap.get(`${d.id}:${r.id}`);
                    return (
                      <td
                        key={r.id}
                        className={`px-4 py-3 text-center ${
                          qty ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {qty ?? "\u2014"}
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
  );
}
