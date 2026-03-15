"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { Configuracao } from "@/types/database";

// Rich metadata for each config key — human-friendly names, descriptions, help text
const configMeta: Record<string, { nome: string; descricao: string; ajuda: string; unidade?: string; min?: number; max?: number }> = {
  peso_capacidade: {
    nome: "Peso da Capacidade",
    descricao: "Quanto o tamanho da sala influencia na escolha do ambiente para cada turma.",
    ajuda: "Valores mais altos fazem o sistema priorizar salas com tamanho mais adequado ao número de alunos, evitando salas muito grandes (ociosas) ou muito pequenas (lotadas). Recomendado: 0.3 a 0.5.",
    unidade: "0 a 1",
    min: 0, max: 1,
  },
  peso_recursos: {
    nome: "Peso dos Recursos",
    descricao: "Quanto a disponibilidade de equipamentos influencia na alocação.",
    ajuda: "Valores mais altos fazem o sistema priorizar ambientes que possuem os equipamentos necessários (projetores, computadores, microscópios). Se uma disciplina precisa de laboratório, esse peso garante que ela seja alocada em um. Recomendado: 0.4 a 0.6.",
    unidade: "0 a 1",
    min: 0, max: 1,
  },
  peso_especializacao: {
    nome: "Bônus de Especialização",
    descricao: "Prêmio ou penalidade ao usar ambientes especializados.",
    ajuda: "Valores positivos incentivam o uso de laboratórios para disciplinas que os necessitam, e penalizam o uso de labs para aulas básicas (preservando-os). Valor 0 ignora a especialização. Recomendado: 0.05 a 0.15.",
    unidade: "0 a 1",
    min: 0, max: 1,
  },
  capacidade_minima_pct: {
    nome: "Ocupação Mínima Desejável",
    descricao: "Percentual mínimo de ocupação de uma sala para ser considerada eficiente.",
    ajuda: "Se uma turma de 10 alunos é colocada em uma sala de 200 lugares, a ocupação é 5% — muito baixa. Este parâmetro define o limiar abaixo do qual a alocação é considerada ineficiente nos relatórios. Recomendado: 40% a 60%.",
    unidade: "%",
    min: 0, max: 100,
  },
  capacidade_maxima_pct: {
    nome: "Ocupação Máxima Permitida",
    descricao: "Limite máximo de ocupação antes de considerar superlotação.",
    ajuda: "Previne que turmas sejam alocadas em salas quase ou totalmente lotadas. Uma sala com 100% de ocupação não tem margem para variações. Recomendado: 90% a 100%.",
    unidade: "%",
    min: 50, max: 100,
  },
  semestre_atual: {
    nome: "Semestre Atual",
    descricao: "Identifica o período acadêmico vigente para filtros e planejamentos.",
    ajuda: "Formato: ano.semestre (ex: 2026.1 para primeiro semestre de 2026, 2026.2 para segundo). Este valor é usado como padrão ao criar novos planejamentos.",
  },
  ano_letivo: {
    nome: "Ano Letivo",
    descricao: "Ano acadêmico em vigor.",
    ajuda: "Usado como referência para turmas, planejamentos e relatórios. Atualize no início de cada ano letivo.",
  },
  turnos_disponiveis: {
    nome: "Turnos Disponíveis",
    descricao: "Quais turnos a instituição opera para alocação de turmas.",
    ajuda: "Marque os turnos em que a instituição funciona. Se a instituição não opera à noite, desmarque para evitar que o algoritmo tente alocar turmas nesse turno.",
  },
  max_turmas_por_docente: {
    nome: "Máximo de Turmas por Docente",
    descricao: "Limite de turmas que um professor pode lecionar por semestre.",
    ajuda: "Protege contra sobrecarga docente. O sistema alerta quando um professor se aproxima do limite. Recomendado: 3 a 6 turmas por semestre.",
    unidade: "turmas",
    min: 1, max: 20,
  },
  nome_instituicao: {
    nome: "Nome da Instituição",
    descricao: "Nome oficial exibido em relatórios e cabeçalhos.",
    ajuda: "Este nome aparece nos relatórios exportados, grade horária e documentos oficiais do sistema.",
  },
};

const tabs = [
  { id: "algoritmo", label: "Algoritmo de Alocação", icon: "⚙️", descricao: "Parâmetros que controlam como o sistema distribui turmas nos ambientes" },
  { id: "calendario", label: "Calendário Acadêmico", icon: "📅", descricao: "Configurações de período letivo e turnos de funcionamento" },
  { id: "limites", label: "Limites e Regras", icon: "🛡️", descricao: "Restrições de capacidade e carga docente" },
  { id: "geral", label: "Geral", icon: "🏫", descricao: "Informações gerais da instituição" },
] as const;

const TURNOS_OPTIONS = [
  { value: "manha", label: "Manhã (7h - 12h)" },
  { value: "tarde", label: "Tarde (13h - 18h)" },
  { value: "noite", label: "Noite (18h30 - 22h30)" },
];

function getInnerValue(valor: unknown): unknown {
  if (typeof valor === "object" && valor !== null && "valor" in valor) {
    return (valor as { valor: unknown }).valor;
  }
  return valor;
}

function getDisplayValue(valor: unknown): string {
  const inner = getInnerValue(valor);
  if (inner === null || inner === undefined) return "—";
  if (Array.isArray(inner)) {
    return inner.map(v => {
      const opt = TURNOS_OPTIONS.find(o => o.value === v);
      return opt ? opt.label.split(" (")[0] : v;
    }).join(", ");
  }
  return String(inner);
}

function getInputType(chave: string, innerValue: unknown): "number" | "text" | "array" {
  if (chave === "turnos_disponiveis" || Array.isArray(innerValue)) return "array";
  if (typeof innerValue === "number") return "number";
  return "text";
}

interface EditModalProps {
  config: Configuracao;
  onClose: () => void;
  onSave: (chave: string, newValor: unknown) => Promise<void>;
}

function EditModal({ config, onClose, onSave }: EditModalProps) {
  const meta = configMeta[config.chave];
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
        if (meta?.min !== undefined && (newInner as number) < meta.min) {
          toast(`Valor mínimo: ${meta.min}`, "error");
          setSaving(false);
          return;
        }
        if (meta?.max !== undefined && (newInner as number) > meta.max) {
          toast(`Valor máximo: ${meta.max}`, "error");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="border-b border-[var(--color-primary-light)] p-6 pb-4">
          <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)]">
            {meta?.nome ?? config.chave}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {meta?.descricao ?? config.descricao}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Help text */}
          {meta?.ajuda && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <div className="flex gap-2">
                <span className="text-blue-500 shrink-0">ℹ️</span>
                <p className="text-xs text-blue-700 leading-relaxed">{meta.ajuda}</p>
              </div>
            </div>
          )}

          {/* Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
              Valor {meta?.unidade && <span className="normal-case font-normal">({meta.unidade})</span>}
            </label>

            {inputType === "array" ? (
              <div className="space-y-2">
                {TURNOS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      arrayValue.includes(opt.value)
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                        : "border-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={arrayValue.includes(opt.value)}
                      onChange={() => setArrayValue(prev =>
                        prev.includes(opt.value) ? prev.filter(t => t !== opt.value) : [...prev, opt.value]
                      )}
                      className="h-4 w-4 rounded accent-[var(--color-accent)]"
                    />
                    <span className="text-sm font-medium text-[var(--color-text)]">{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="relative">
                <input
                  type={inputType}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  step={inputType === "number" ? "any" : undefined}
                  min={meta?.min}
                  max={meta?.max}
                  className="w-full rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none transition-colors duration-150"
                />
                {inputType === "number" && meta?.min !== undefined && (
                  <div className="mt-1.5 flex justify-between text-[10px] text-[var(--color-text-muted)]">
                    <span>Min: {meta.min}</span>
                    <span>Max: {meta.max}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-primary-light)] p-6 pt-4 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            Salvar Alteração
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
      setConfigs(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSave = async (chave: string, newValor: unknown) => {
    const res = await fetch(`/api/configuracoes/${encodeURIComponent(chave)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: newValor }),
    });
    if (!res.ok) throw new Error("Erro ao salvar");
    const updated = await res.json();
    setConfigs(prev => prev.map(c => c.chave === chave ? updated : c));
    toast("Configuração atualizada com sucesso!", "success");
  };

  const activeTabData = tabs.find(t => t.id === activeTab);
  const filtered = configs.filter(c => c.categoria === activeTab);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
          Configurações do Sistema
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Ajuste os parâmetros que controlam o comportamento do Planejamento Inteligente.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary-light)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab description */}
      {activeTabData && (
        <p className="text-sm text-[var(--color-text-muted)]">
          {activeTabData.descricao}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 rounded bg-[var(--color-primary-light)]" />
                  <div className="h-3 w-80 rounded bg-[var(--color-primary-light)]" />
                </div>
                <div className="h-8 w-24 rounded bg-[var(--color-primary-light)]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
          Nenhuma configuração nesta categoria.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(config => {
            const meta = configMeta[config.chave];
            return (
              <div
                key={config.id}
                className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {meta?.nome ?? config.chave}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
                      {meta?.descricao ?? config.descricao}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="inline-block text-sm font-semibold font-mono bg-[var(--color-primary-light)] px-3 py-1.5 rounded-md text-[var(--color-text)]">
                        {getDisplayValue(config.valor)}
                      </span>
                      {meta?.unidade && (
                        <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{meta.unidade}</p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      title="Editar"
                      onClick={() => setEditingConfig(config)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
