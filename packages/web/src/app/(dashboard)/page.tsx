"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EntityCount {
  label: string;
  href: string;
  count: number | null;
}

const entities: { label: string; href: string; endpoint: string }[] = [
  { label: "Prédios", href: "/predios", endpoint: "/api/predios" },
  { label: "Ambientes", href: "/ambientes", endpoint: "/api/ambientes" },
  { label: "Recursos", href: "/recursos", endpoint: "/api/recursos" },
  { label: "Cursos", href: "/cursos", endpoint: "/api/cursos" },
  { label: "Disciplinas", href: "/disciplinas", endpoint: "/api/disciplinas" },
  { label: "Pessoas", href: "/pessoas", endpoint: "/api/pessoas" },
  { label: "Turmas", href: "/turmas", endpoint: "/api/turmas" },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState<EntityCount[]>(
    entities.map((e) => ({ label: e.label, href: e.href, count: null }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.all(
        entities.map(async (e) => {
          try {
            const res = await fetch(e.endpoint);
            if (!res.ok) return { label: e.label, href: e.href, count: null };
            const json = await res.json();
            return {
              label: e.label,
              href: e.href,
              count: Array.isArray(json) ? json.length : 0,
            };
          } catch {
            return { label: e.label, href: e.href, count: null };
          }
        })
      );
      setCounts(results);
      setLoading(false);
    };
    fetchCounts();
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
    </div>
  );
}
