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
];

export default function DashboardPage() {
  const [counts, setCounts] = useState<EntityCount[]>(
    entities.map((e) => ({ label: e.label, href: e.href, count: null }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      try {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (error) return <p className="p-6 text-red-600">Erro: {error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Dashboard - Gestão Pedagógica
      </h1>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {item.count !== null ? item.count : "—"}
              </p>
              <p className="mt-1 text-sm text-blue-600">Ver todos →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
