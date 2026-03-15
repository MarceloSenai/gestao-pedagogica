"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type { Predio, PredioInsert } from "@/types/database";

const emptyForm: PredioInsert = { nome: "", endereco: null };

export default function PrediosPage() {
  const [data, setData] = useState<Predio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Predio | null>(null);
  const [form, setForm] = useState<PredioInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/predios");
      if (!res.ok) throw new Error("Erro ao carregar prédios");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item: Predio) => {
    setEditing(item);
    setForm({ nome: item.nome, endereco: item.endereco ?? null });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir prédio "${item?.nome ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/predios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/predios/${editing.id}` : "/api/predios";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Predio>[] = [
    { key: "nome", label: "Nome" },
    { key: "endereco", label: "Endereço" },
    {
      key: "id",
      label: "Navegação",
      render: (_v, item) => (
        <Link
          href={`/ambientes?predio_id=${item.id}`}
          className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-primary-light)] transition-colors"
          title="Ver Ambientes"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </Link>
      ),
    },
  ];

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">Prédios</h1>
        <Button variant="primary" onClick={openCreate}>
          Novo Prédio
        </Button>
      </div>

      <DataTable<Predio>
        columns={columns}
        data={data}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Prédio" : "Novo Prédio"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Nome"
            name="nome"
            type="text"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            required
            placeholder="Nome do prédio"
          />
          <FormField
            label="Endereço"
            name="endereco"
            type="text"
            value={form.endereco ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
            placeholder="Endereço do prédio"
          />
        </div>
      </Modal>
    </div>
  );
}
