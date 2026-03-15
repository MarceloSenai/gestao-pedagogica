"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Notificacao } from "@/types/database";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

const tipoConfig: Record<string, { icon: string; color: string }> = {
  info: { icon: "\u2139", color: "text-blue-500" },
  alerta: { icon: "\u26A0", color: "text-yellow-500" },
  conflito: { icon: "\u2715", color: "text-red-500" },
  sistema: { icon: "\u2699", color: "text-gray-500" },
};

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes/nao-lidas");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notificacoes?lida=false");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.slice(0, 5));
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notificacoes/${id}/ler`, { method: "POST" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notificacoes/marcar-todas-lidas", { method: "POST" });
    setNotifications([]);
    setCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-md p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
        aria-label="Notificações"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-[var(--color-primary-light)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Notificações
            </span>
            {count > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">
                Nenhuma notificação não lida
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = tipoConfig[n.tipo] ?? tipoConfig.info;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="flex w-full items-start gap-3 border-b border-[var(--color-primary-light)] px-4 py-3 text-left hover:bg-[var(--color-primary-light)]/30 transition-colors cursor-pointer last:border-b-0"
                  >
                    <span className={`mt-0.5 text-base ${cfg.color}`}>{cfg.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {n.titulo}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {n.mensagem}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
                      {timeAgo(n.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-[var(--color-primary-light)] px-4 py-2">
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
