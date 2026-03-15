"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Ambiente, Chamado } from "@/types/database";

interface ChamadoStats {
  por_status: Record<string, number>;
  por_prioridade: Record<string, number>;
  total_abertos: number;
}

interface StatCard {
  label: string;
  value: number;
  color: string;
  borderColor: string;
}

export default function InfraestruturaPage() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [chamadosAbertos, setChamadosAbertos] = useState<Chamado[]>([]);
  const [stats, setStats] = useState<ChamadoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ambRes, statsRes, chamadosRes] = await Promise.all([
          fetch("/api/ambientes"),
          fetch("/api/chamados/stats"),
          fetch("/api/chamados?status=aberto"),
        ]);
        if (!ambRes.ok) throw new Error("Erro ao carregar ambientes");
        if (!statsRes.ok) throw new Error("Erro ao carregar estatísticas");
        if (!chamadosRes.ok) throw new Error("Erro ao carregar chamados");
        setAmbientes(await ambRes.json());
        setStats(await statsRes.json());
        setChamadosAbertos(await chamadosRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" />
        <div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );

  const ambientesAtivos = ambientes.filter(
    (a) => !a.status || a.status === "ativo"
  ).length;
  const ambientesManutencao = ambientes.filter(
    (a) => a.status === "em_manutencao"
  ).length;
  const ambientesDesativados = ambientes.filter(
    (a) => a.status === "desativado"
  ).length;

  const ambienteCards: StatCard[] = [
    {
      label: "Ambientes Ativos",
      value: ambientesAtivos,
      color: "text-green-700",
      borderColor: "border-green-200 bg-green-50",
    },
    {
      label: "Em Manutenção",
      value: ambientesManutencao,
      color: "text-yellow-700",
      borderColor: "border-yellow-200 bg-yellow-50",
    },
    {
      label: "Desativados",
      value: ambientesDesativados,
      color: "text-red-700",
      borderColor: "border-red-200 bg-red-50",
    },
  ];

  const chamadoCards: StatCard[] = [
    {
      label: "Chamados Abertos",
      value: stats?.por_status?.aberto ?? 0,
      color: "text-red-700",
      borderColor: "border-red-200 bg-red-50",
    },
    {
      label: "Em Andamento",
      value: stats?.por_status?.em_andamento ?? 0,
      color: "text-yellow-700",
      borderColor: "border-yellow-200 bg-yellow-50",
    },
    {
      label: "Resolvidos",
      value: stats?.por_status?.resolvido ?? 0,
      color: "text-green-700",
      borderColor: "border-green-200 bg-green-50",
    },
  ];

  const chamadosUrgentes = chamadosAbertos.filter(
    (c) => c.prioridade === "alta" || c.prioridade === "urgente"
  );

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
        Visão Geral — Infraestrutura
      </h1>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Ambientes
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ambienteCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-lg border p-5 ${card.borderColor}`}
            >
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className={`mt-1 text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Chamados
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {chamadoCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-lg border p-5 ${card.borderColor}`}
            >
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className={`mt-1 text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Chamados Prioritários (Abertos)
          </h2>
          <Link
            href="/chamados"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {chamadosUrgentes.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">
              Nenhum chamado aberto com prioridade alta ou urgente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                    Prioridade
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {chamadosUrgentes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-accent-light)]/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{c.titulo}</td>
                    <td className="px-4 py-3">
                      {c.tipo === "ambiente" ? "Ambiente" : "Recurso"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={c.prioridade}
                        variant="prioridade"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
