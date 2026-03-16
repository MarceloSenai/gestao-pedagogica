"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EntityCount {
  label: string;
  href: string;
  count: number | null;
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d atras`;
}

const entities: { label: string; href: string; endpoint: string }[] = [
  { label: "Prédios", href: "/predios", endpoint: "/api/predios" },
  { label: "Ambientes", href: "/ambientes", endpoint: "/api/ambientes" },
  { label: "Recursos", href: "/recursos", endpoint: "/api/recursos" },
  { label: "Cursos", href: "/cursos", endpoint: "/api/cursos" },
  { label: "Disciplinas", href: "/disciplinas", endpoint: "/api/disciplinas" },
  { label: "Pessoas", href: "/pessoas", endpoint: "/api/pessoas" },
  { label: "Turmas", href: "/turmas", endpoint: "/api/turmas" },
  { label: "Chamados", href: "/chamados", endpoint: "/api/chamados" },
  { label: "Planejamentos", href: "/planejamentos", endpoint: "/api/planejamentos" },
  { label: "Relatórios", href: "/relatorios", endpoint: "" },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState<EntityCount[]>(
    entities.map((e) => ({ label: e.label, href: e.href, count: null }))
  );
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<
    Array<{ tipo: string; nome: string; data: string; href: string }>
  >([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCounts = async () => {
      const results = await Promise.all(
        entities.map(async (e) => {
          if (!e.endpoint) {
            return { label: e.label, href: e.href, count: null };
          }
          try {
            const res = await fetch(e.endpoint, {
              signal: controller.signal,
            });
            if (!res.ok) return { label: e.label, href: e.href, count: null };
            const json = await res.json();
            return {
              label: e.label,
              href: e.href,
              count: Array.isArray(json) ? json.length : 0,
            };
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
              return { label: e.label, href: e.href, count: null };
            }
            return { label: e.label, href: e.href, count: null };
          }
        })
      );
      setCounts(results);
      setLoading(false);
    };
    fetchCounts();

    fetch("/api/atividade-recente", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then(setActivities)
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
        Dashboard — Gestão Pedagógica
      </h1>
      <p className="text-sm text-[var(--color-text-muted)]">Visão geral das entidades cadastradas</p>
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" />
          <div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <p className="text-sm font-medium text-[var(--color-text-muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-4xl font-bold text-[var(--color-text)]">
                {item.count !== null ? item.count : "—"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform">
                Ver todos →
              </p>
            </Link>
          ))}
        </div>
      )}

      {activities.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)] mb-3">
            Atividade Recente
          </h2>
          <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] divide-y divide-[var(--color-primary-light)]">
            {activities.map((a, i) => (
              <a
                key={i}
                href={a.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-primary-light)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                    {a.tipo}
                  </span>
                  <span className="text-sm text-[var(--color-text)]">
                    {a.nome}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {timeAgo(a.data)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
