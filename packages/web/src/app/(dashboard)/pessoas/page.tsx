"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type { Pessoa, PessoaInsert, PessoaPerfil } from "@/types/database";

const perfilOptions: { value: PessoaPerfil; label: string }[] = [
  { value: "gestor", label: "Gestor" },
  { value: "coordenador", label: "Coordenador" },
  { value: "secretaria", label: "Secretária" },
  { value: "docente", label: "Docente" },
  { value: "aluno", label: "Aluno" },
  { value: "apoio_ti", label: "Apoio TI" },
  { value: "auditor", label: "Auditor" },
];

const perfilLabelMap = Object.fromEntries(
  perfilOptions.map((p) => [p.value, p.label])
);

const emptyForm: PessoaInsert = {
  nome: "",
  perfil: "docente",
  competencias: null,
  disponibilidade: null,
};

export default function PessoasPage() {
  const [data, setData] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pessoa | null>(null);
  const [form, setForm] = useState<PessoaInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [filtroPerfil, setFiltroPerfil] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pessoas");
      if (!res.ok) throw new Error("Erro ao carregar pessoas");
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

  const filteredData = filtroPerfil
    ? data.filter((p) => p.perfil === filtroPerfil)
    : data;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item: Pessoa) => {
    setEditing(item);
    setForm({
      nome: item.nome,
      perfil: item.perfil,
      competencias: item.competencias,
      disponibilidade: item.disponibilidade,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir pessoa "${item?.nome ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/pessoas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.perfil) return;
    setSaving(true);
    try {
      const url = editing ? `/api/pessoas/${editing.id}` : "/api/pessoas";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.nome, perfil: form.perfil }),
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

  const columns: Column<Pessoa>[] = [
    { key: "nome", label: "Nome" },
    {
      key: "perfil",
      label: "Perfil",
      render: (_v, item) => perfilLabelMap[item.perfil] ?? item.perfil,
    },
  ];

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">Pessoas</h1>
        <Button variant="primary" onClick={openCreate}>
          Nova Pessoa
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          Filtrar por perfil:
        </label>
        <select
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
        >
          <option value="">Todos</option>
          {perfilOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable<Pessoa>
        columns={columns}
        data={filteredData}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Pessoa" : "Nova Pessoa"}
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
            placeholder="Nome da pessoa"
          />
          <FormField
            label="Perfil"
            name="perfil"
            type="select"
            value={form.perfil}
            onChange={(e) =>
              setForm((f) => ({ ...f, perfil: e.target.value as PessoaPerfil }))
            }
            required
            options={perfilOptions}
          />
        </div>
      </Modal>
    </div>
  );
}
