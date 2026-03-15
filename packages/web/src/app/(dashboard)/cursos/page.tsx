"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type { Curso, CursoInsert } from "@/types/database";

const emptyForm: CursoInsert = { nome: "", descricao: null };

export default function CursosPage() {
  const [data, setData] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);
  const [form, setForm] = useState<CursoInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cursos");
      if (!res.ok) throw new Error("Erro ao carregar cursos");
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

  const openEdit = (item: Curso) => {
    setEditing(item);
    setForm({ nome: item.nome, descricao: item.descricao ?? null });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir curso "${item?.nome ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/cursos/${id}`, { method: "DELETE" });
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
      const url = editing ? `/api/cursos/${editing.id}` : "/api/cursos";
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

  const columns: Column<Curso>[] = [
    { key: "nome", label: "Nome" },
    { key: "descricao", label: "Descrição" },
    {
      key: "id",
      label: "Navegação",
      render: (_v, item) => (
        <Link
          href={`/disciplinas?curso_id=${item.id}`}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Ver Disciplinas
        </Link>
      ),
    },
  ];

  if (loading) return <p className="p-6 text-gray-500">Carregando...</p>;
  if (error) return <p className="p-6 text-red-600">Erro: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
        <Button variant="primary" onClick={openCreate}>
          Novo Curso
        </Button>
      </div>

      <DataTable<Curso>
        columns={columns}
        data={data}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Curso" : "Novo Curso"}
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
            placeholder="Nome do curso"
          />
          <FormField
            label="Descrição"
            name="descricao"
            type="textarea"
            value={form.descricao ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            placeholder="Descrição do curso"
          />
        </div>
      </Modal>
    </div>
  );
}
