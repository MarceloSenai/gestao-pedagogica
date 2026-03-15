"use client";

import { useEffect, useState } from "react";
import type { Recurso } from "@/types/database";

interface DisciplinaMatriz {
  id: string;
  nome: string;
  requisitos_recursos: Array<{
    recurso_id: string;
    recurso_nome?: string;
    quantidade: number;
  }>;
  cursos: { nome: string } | null;
}

export default function MatrizRecursosPage() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaMatriz[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [matrizRes, recRes] = await Promise.all([
          fetch("/api/matriz-recursos"),
          fetch("/api/recursos"),
        ]);
        if (!matrizRes.ok) throw new Error("Erro ao carregar matriz de recursos");
        if (!recRes.ok) throw new Error("Erro ao carregar recursos");

        setDisciplinas(await matrizRes.json());
        setRecursos(await recRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build lookup: disciplina_id + recurso_id → quantidade
  const matrizMap = new Map<string, number>();
  for (const disc of disciplinas) {
    if (Array.isArray(disc.requisitos_recursos)) {
      for (const req of disc.requisitos_recursos) {
        matrizMap.set(`${disc.id}:${req.recurso_id}`, req.quantidade || 1);
      }
    }
  }

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
        Matriz de Recursos
      </h1>

      {disciplinas.length === 0 || recursos.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">
          Nenhum dado disponível. Cadastre disciplinas e recursos primeiro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)] shadow-sm bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)] sticky left-0 bg-[var(--color-primary-light)]">
                  Disciplina
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text-muted)]">
                  Curso
                </th>
                {recursos.map((r) => (
                  <th
                    key={r.id}
                    className="px-4 py-3 text-center text-xs uppercase tracking-wider font-medium text-[var(--color-text)] whitespace-nowrap"
                  >
                    {r.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((d) => {
                const hasAny = recursos.some((r) => matrizMap.has(`${d.id}:${r.id}`));
                return (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-accent-light)]/40 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 font-medium sticky left-0 bg-[var(--color-surface)]">
                      {d.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {d.cursos?.nome ?? "—"}
                    </td>
                    {recursos.map((r) => {
                      const qty = matrizMap.get(`${d.id}:${r.id}`);
                      return (
                        <td
                          key={r.id}
                          className={`px-4 py-3 text-center ${
                            qty
                              ? "font-medium text-[var(--color-accent)]"
                              : "text-[var(--color-text-muted)] opacity-30"
                          }`}
                        >
                          {qty ? `${qty}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
