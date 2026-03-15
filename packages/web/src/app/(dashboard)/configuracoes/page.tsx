"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { Configuracao } from "@/types/database";

const tabs = [
  { id: "algoritmo", label: "Algoritmo" },
  { id: "calendario", label: "Calendário" },
  { id: "limites", label: "Limites" },
  { id: "geral", label: "Geral" },
] as const;

const TURNOS_OPTIONS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
];

function getDisplayValue(valor: unknown): string {
  if (valor === null || valor === undefined) return "-";
  if (typeof valor === "object" && valor !== null && "valor" in valor) {
    const inner = (valor as { valor: unknown }).valor;
    if (Array.isArray(inner)) return inner.join(", ");
    return String(inner);
  }
  return JSON.stringify(valor);
}

function getInnerValue(valor: unknown): unknown {
  if (typeof valor === "object" && valor !== null && "valor" in valor) {
    return (valor as { valor: unknown }).valor;
  }
  return valor;
}

function getInputType(
  chave: string,
  innerValue: unknown
): "number" | "text" | "array" {
  if (chave === "turnos_disponiveis" || Array.isArray(innerValue))
    return "array";
  if (typeof innerValue === "number") return "number";
  return "text";
}

interface EditModalProps {
  config: Configuracao;
  onClose: () => void;
  onSave: (chave: string, newValor: unknown) => Promise<void>;
}

function EditModal({ config, onClose, onSave }: EditModalProps) {
  const innerValue = getInnerValue(config.valor);
  const inputType = getInputType(config.chave, innerValue);
  const [value, setValue] = useState<string>(
    inputType === "array" ? "" : String(innerValue ?? "")
  );
  const [arrayValue, setArrayValue] = useState<string[]>(
    Array.isArray(innerValue) ? (innerValue as string[]) : []
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let newInner: unknown;
      if (inputType === "number") {
        newInner = Number(value);
        if (isNaN(newInner as number)) {
          toast("Valor inválido. Insira um número.", "error");
          setSaving(false);
          return;
        }
      } else if (inputType === "array") {
        newInner = arrayValue;
      } else {
        newInner = value;
      }
      await onSave(config.chave, { valor: newInner });
      onClose();
    } catch {
      toast("Erro ao salvar configuração.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleTurno = (turno: string) => {
    setArrayValue((prev) =>
      prev.includes(turno) ? prev.filter((t) => t !== turno) : [...prev, turno]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          Editar Configuração
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {config.chave}
        </p>
        {config.descricao && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {config.descricao}
          </p>
        )}

        <div className="mt-4">
          {inputType === "array" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Turnos
              </p>
              {TURNOS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={arrayValue.includes(opt.value)}
                    onChange={() => toggleTurno(opt.value)}
                    className="h-4 w-4 rounded border-[var(--color-primary-light)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step={inputType === "number" ? "any" : undefined}
              className="w-full rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("algoritmo");
  const [editingConfig, setEditingConfig] = useState<Configuracao | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/configuracoes");
      if (!res.ok) throw new Error("Falha ao carregar configurações");
      const data = await res.json();
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async (chave: string, newValor: unknown) => {
    const res = await fetch(`/api/configuracoes/${encodeURIComponent(chave)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: newValor }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao salvar");
    }
    const updated = await res.json();
    setConfigs((prev) =>
      prev.map((c) => (c.chave === chave ? updated : c))
    );
    toast("Configuração atualizada com sucesso!", "success");
  };

  const filtered = configs.filter((c) => c.categoria === activeTab);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-text)]">
          Configurações do Sistema
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Parametrize o algoritmo de alocação, calendário acadêmico e limites
          globais.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary-light)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-64 rounded bg-gray-200" />
                </div>
                <div className="h-6 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
          Nenhuma configuração nesta categoria.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((config) => (
            <div
              key={config.id}
              className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {config.chave}
                  </p>
                  {config.descricao && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {config.descricao}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm font-mono bg-[var(--color-primary-light)] px-2 py-1 rounded">
                    {getDisplayValue(config.valor)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Editar"
                    onClick={() => setEditingConfig(config)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingConfig && (
        <EditModal
          config={editingConfig}
          onClose={() => setEditingConfig(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
