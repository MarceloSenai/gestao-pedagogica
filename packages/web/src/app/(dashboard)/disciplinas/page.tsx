"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type { Disciplina, DisciplinaInsert, Curso } from "@/types/database";

const emptyForm: DisciplinaInsert = {
  nome: "",
  curso_id: "",
  carga_horaria: 0,
  requisitos_recursos: null,
};

export default function DisciplinasPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Disciplina | null>(null);
  const [form, setForm] = useState<DisciplinaInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [filtroCursoId, setFiltroCursoId] = useState("");
  const [urlParamApplied, setUrlParamApplied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [discRes, cursoRes] = await Promise.all([
        fetch("/api/disciplinas"),
        fetch("/api/cursos"),
      ]);
      if (!discRes.ok) throw new Error("Erro ao carregar disciplinas");
      if (!cursoRes.ok) throw new Error("Erro ao carregar cursos");
      setData(await discRes.json());
      setCursos(await cursoRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!urlParamApplied) {
      const cursoIdParam = searchParams.get("curso_id");
      if (cursoIdParam) {
        setFiltroCursoId(cursoIdParam);
      }
      setUrlParamApplied(true);
    }
  }, [searchParams, urlParamApplied]);

  const cursoMap = Object.fromEntries(cursos.map((c) => [c.id, c.nome]));
  const cursoOptions = cursos.map((c) => ({ value: c.id, label: c.nome }));

  const filteredData = filtroCursoId
    ? data.filter((d) => d.curso_id === filtroCursoId)
    : data;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item: Disciplina) => {
    setEditing(item);
    setForm({
      nome: item.nome,
      curso_id: item.curso_id,
      carga_horaria: item.carga_horaria,
      requisitos_recursos: item.requisitos_recursos,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir disciplina "${item?.nome ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/disciplinas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.curso_id) return;
    setSaving(true);
    try {
      const url = editing
        ? `/api/disciplinas/${editing.id}`
        : "/api/disciplinas";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          curso_id: form.curso_id,
          carga_horaria: form.carga_horaria,
        }),
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

  const columns: Column<Disciplina>[] = [
    { key: "nome", label: "Nome" },
    {
      key: "curso_id",
      label: "Curso",
      render: (_v, item) => cursoMap[item.curso_id] ?? "—",
    },
    { key: "carga_horaria", label: "Carga Horária" },
  ];

  if (loading) return <p className="p-6 text-gray-500">Carregando...</p>;
  if (error) return <p className="p-6 text-red-600">Erro: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1>
        <Button variant="primary" onClick={openCreate}>
          Nova Disciplina
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          Filtrar por curso:
        </label>
        <select
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          value={filtroCursoId}
          onChange={(e) => setFiltroCursoId(e.target.value)}
        >
          <option value="">Todos</option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <DataTable<Disciplina>
        columns={columns}
        data={filteredData}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Disciplina" : "Nova Disciplina"}
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
            placeholder="Nome da disciplina"
          />
          <FormField
            label="Curso"
            name="curso_id"
            type="select"
            value={form.curso_id}
            onChange={(e) => setForm((f) => ({ ...f, curso_id: e.target.value }))}
            required
            options={cursoOptions}
            placeholder="Selecione um curso"
          />
          <FormField
            label="Carga Horária"
            name="carga_horaria"
            type="number"
            value={String(form.carga_horaria)}
            onChange={(e) =>
              setForm((f) => ({ ...f, carga_horaria: Number(e.target.value) }))
            }
            required
          />
          {editing?.requisitos_recursos && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requisitos de Recursos (somente leitura)
              </label>
              <pre className="rounded-md border border-gray-300 bg-gray-50 p-3 text-xs text-gray-600 overflow-auto max-h-40">
                {JSON.stringify(editing.requisitos_recursos, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
