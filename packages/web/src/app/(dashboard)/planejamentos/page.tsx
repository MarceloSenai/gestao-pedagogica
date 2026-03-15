"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Planejamento } from "@/types/database";

export default function PlanejamentosPage() {
  const router = useRouter();
  const [data, setData] = useState<Planejamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ semestre: "", ano: new Date().getFullYear() });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planejamentos");
      if (!res.ok) throw new Error("Erro ao carregar planejamentos");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!form.semestre.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/planejamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao criar planejamento");
      setModalOpen(false);
      setForm({ semestre: "", ano: new Date().getFullYear() });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir este planejamento?")) return;
    try {
      const res = await fetch(`/api/planejamentos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao excluir");
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" />
        <div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
          Planejamentos
        </h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Novo Planejamento
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-primary-light)] shadow-sm bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/60">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                Semestre
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                Ano
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                Data Criacao
              </th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium text-[var(--color-text)]">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  Nenhum planejamento encontrado.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-accent-light)]/40 transition-colors duration-100 cursor-pointer"
                  onClick={() => router.push(`/planejamentos/${item.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{item.semestre}</td>
                  <td className="px-4 py-3">{item.ano}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} variant="planejamento" />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {item.status === "rascunho" && (
                        <Button
                          variant="danger"
                          size="sm"
                          title="Excluir"
                          onClick={() => handleDelete(item.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Planejamento"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              Criar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Semestre"
            name="semestre"
            type="text"
            value={form.semestre}
            onChange={(e) => setForm((f) => ({ ...f, semestre: e.target.value }))}
            required
            placeholder="Ex: 2026.1"
          />
          <FormField
            label="Ano"
            name="ano"
            type="number"
            value={String(form.ano)}
            onChange={(e) => setForm((f) => ({ ...f, ano: Number(e.target.value) }))}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
