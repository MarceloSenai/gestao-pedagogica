"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Kpis {
  ambientes_ativos: number;
  ocupacao_media: number;
  chamados_abertos: number;
  recursos_indisponiveis: number;
  total_turmas: number;
  total_alunos: number;
}

const kpiCards: {
  key: keyof Kpis;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "ambientes_ativos",
    label: "Ambientes Ativos",
    color: "text-green-600",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: "ocupacao_media",
    label: "Ocupação Média",
    color: "text-blue-600",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: "chamados_abertos",
    label: "Chamados Abertos",
    color: "text-orange-600",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    key: "recursos_indisponiveis",
    label: "Recursos Indispon.",
    color: "text-red-600",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: "total_turmas",
    label: "Total Turmas",
    color: "text-purple-600",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: "total_alunos",
    label: "Total Alunos",
    color: "text-teal-600",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

const reportLinks = [
  { label: "Utilização de Ambientes", href: "/relatorios/ambientes", description: "Capacidade, status e ocupação dos ambientes" },
  { label: "Demanda Pedagógica", href: "/relatorios/demanda", description: "Turmas, vagas e ocupação por curso" },
  { label: "Recursos e Demanda", href: "/relatorios/recursos", description: "Disponibilidade e demanda de recursos" },
];

export default function RelatoriosDashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/relatorios/kpis")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar KPIs");
        return res.json();
      })
      .then((data: Kpis) => {
        setKpis(data);
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
          Dashboard de Relatórios
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Indicadores consolidados e acesso aos relatórios detalhados
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg bg-[var(--color-primary-light)]"
            />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiCards.map((card) => (
            <div
              key={card.key}
              className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  {card.label}
                </p>
                <span className="shrink-0">{card.icon}</span>
              </div>
              <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                {card.key === "ocupacao_media"
                  ? `${kpis[card.key]}%`
                  : kpis[card.key]}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)]">
          Relatórios Detalhados
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group block rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {link.label}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {link.description}
              </p>
              <p className="mt-3 text-sm text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform">
                Ver relatório →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
