"use client";

import { useState, useEffect, useCallback } from "react";
import type { Notificacao, NotificacaoTipo } from "@/types/database";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  return `${Math.floor(seconds / 86400)}d atrás`;
}

const tipoConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  info: { icon: "\u2139", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Info" },
  alerta: { icon: "\u26A0", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Alerta" },
  conflito: { icon: "\u2715", color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Conflito" },
  sistema: { icon: "\u2699", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", label: "Sistema" },
};

const TIPOS: { value: string; label: string }[] = [
  { value: "", label: "Todos os tipos" },
  { value: "info", label: "Info" },
  { value: "alerta", label: "Alerta" },
  { value: "conflito", label: "Conflito" },
  { value: "sistema", label: "Sistema" },
];

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState("");
  const [lidaFilter, setLidaFilter] = useState<"" | "true" | "false">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tipoFilter) params.set("tipo", tipoFilter);
      if (lidaFilter) params.set("lida", lidaFilter);
      const qs = params.toString();
      const res = await fetch(`/api/notificacoes${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar notificações");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [tipoFilter, lidaFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notificacoes/${id}/ler`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notificacoes/marcar-todas-lidas", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const unreadCount = notifications.filter((n) => !n.lida).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-text)]">
            Notificações
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Todas lidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as NotificacaoTipo | "")}
          className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={lidaFilter}
          onChange={(e) => setLidaFilter(e.target.value as "" | "true" | "false")}
          className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
        >
          <option value="">Todas</option>
          <option value="false">Não lidas</option>
          <option value="true">Lidas</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
          Nenhuma notificação encontrada.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = tipoConfig[n.tipo] ?? tipoConfig.info;
            const isExpanded = expandedId === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setExpandedId(isExpanded ? null : n.id);
                  if (!n.lida) handleMarkRead(n.id);
                }}
                className={`w-full text-left rounded-lg border bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-primary-light)]/20 cursor-pointer ${
                  !n.lida
                    ? "border-l-4 border-l-[var(--color-accent)] border-t-[var(--color-primary-light)] border-r-[var(--color-primary-light)] border-b-[var(--color-primary-light)]"
                    : "border-[var(--color-primary-light)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-lg ${cfg.color}`}>{cfg.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {n.titulo}
                      </span>
                      {!n.lida && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      )}
                    </div>
                    {isExpanded ? (
                      <p className="mt-2 text-sm text-[var(--color-text-muted)] whitespace-pre-wrap">
                        {n.mensagem}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)] truncate">
                        {n.mensagem}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
