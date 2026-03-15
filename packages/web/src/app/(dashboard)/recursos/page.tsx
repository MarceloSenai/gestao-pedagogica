"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type { Recurso, RecursoInsert } from "@/types/database";

const emptyForm: RecursoInsert = { nome: "", quantidade: 0 };

export default function RecursosPage() {
  const [data, setData] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recurso | null>(null);
  const [form, setForm] = useState<RecursoInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recursos");
      if (!res.ok) throw new Error("Erro ao carregar recursos");
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

  const openEdit = (item: Recurso) => {
    setEditing(item);
    setForm({ nome: item.nome, quantidade: item.quantidade });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir recurso "${item?.nome ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/recursos/${id}`, { method: "DELETE" });
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
      const url = editing ? `/api/recursos/${editing.id}` : "/api/recursos";
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

  const columns = [
    { key: "nome" as const, label: "Nome" },
    { key: "quantidade" as const, label: "Quantidade" },
  ];

  if (loading) return <p className="p-6 text-gray-500">Carregando...</p>;
  if (error) return <p className="p-6 text-red-600">Erro: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recursos</h1>
        <Button variant="primary" onClick={openCreate}>
          Novo Recurso
        </Button>
      </div>

      <DataTable<Recurso>
        columns={columns}
        data={data}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Recurso" : "Novo Recurso"}
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
            placeholder="Nome do recurso"
          />
          <FormField
            label="Quantidade"
            name="quantidade"
            type="number"
            value={String(form.quantidade)}
            onChange={(e) => setForm((f) => ({ ...f, quantidade: Number(e.target.value) }))}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
