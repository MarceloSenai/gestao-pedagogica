"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { TreeView, type TreeNode } from "@/components/ui/tree-view";
import type { Ambiente, AmbienteInsert, AmbienteTipo, Predio } from "@/types/database";

const tipoOptions: { value: AmbienteTipo; label: string }[] = [
  { value: "sala", label: "Sala" },
  { value: "laboratorio", label: "Laboratório" },
  { value: "auditorio", label: "Auditório" },
  { value: "oficina", label: "Oficina" },
];

const emptyForm: AmbienteInsert = {
  nome: "",
  tipo: "sala",
  capacidade: 0,
  predio_id: "",
};

export default function AmbientesPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Ambiente[]>([]);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ambiente | null>(null);
  const [form, setForm] = useState<AmbienteInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [filtroPredioid, setFiltroPredioid] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [urlParamApplied, setUrlParamApplied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ambRes, predRes] = await Promise.all([
        fetch("/api/ambientes"),
        fetch("/api/predios"),
      ]);
      if (!ambRes.ok) throw new Error("Erro ao carregar ambientes");
      if (!predRes.ok) throw new Error("Erro ao carregar prédios");
      setData(await ambRes.json());
      setPredios(await predRes.json());
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
      const predioIdParam = searchParams.get("predio_id");
      if (predioIdParam) {
        setFiltroPredioid(predioIdParam);
      }
      setUrlParamApplied(true);
    }
  }, [searchParams, urlParamApplied]);

  const treeNodes = useMemo<TreeNode[]>(() => {
    return predios.map((p) => ({
      id: p.id,
      label: p.nome,
      sublabel: p.endereco ?? undefined,
      children: data
        .filter((a) => a.predio_id === p.id)
        .map((a) => ({
          id: a.id,
          label: a.nome,
          sublabel: `${tipoOptions.find((t) => t.value === a.tipo)?.label ?? a.tipo} - Cap. ${a.capacidade}`,
        })),
    }));
  }, [predios, data]);

  const predioMap = Object.fromEntries(predios.map((p) => [p.id, p.nome]));
  const predioOptions = predios.map((p) => ({ value: p.id, label: p.nome }));

  const filteredData = filtroPredioid
    ? data.filter((a) => a.predio_id === filtroPredioid)
    : data;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item: Ambiente) => {
    setEditing(item);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      capacidade: item.capacidade,
      predio_id: item.predio_id,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir ambiente "${item?.nome ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/ambientes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.predio_id) return;
    setSaving(true);
    try {
      const url = editing ? `/api/ambientes/${editing.id}` : "/api/ambientes";
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

  const columns: Column<Ambiente>[] = [
    { key: "nome", label: "Nome" },
    {
      key: "tipo",
      label: "Tipo",
      render: (_v, item) =>
        tipoOptions.find((t) => t.value === item.tipo)?.label ?? item.tipo,
    },
    { key: "capacidade", label: "Capacidade" },
    {
      key: "predio_id",
      label: "Prédio",
      render: (_v, item) => predioMap[item.predio_id] ?? "—",
    },
  ];

  if (loading) return <p className="p-6 text-gray-500">Carregando...</p>;
  if (error) return <p className="p-6 text-red-600">Erro: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ambientes</h1>
        <Button variant="primary" onClick={openCreate}>
          Novo Ambiente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Filtrar por prédio:
          </label>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            value={filtroPredioid}
            onChange={(e) => setFiltroPredioid(e.target.value)}
          >
            <option value="">Todos</option>
            {predios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-gray-300 p-0.5">
          <button
            type="button"
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
            onClick={() => setViewMode("list")}
          >
            Lista
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              viewMode === "tree"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
            onClick={() => setViewMode("tree")}
          >
            Hierarquia
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable<Ambiente>
          columns={columns}
          data={filteredData}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <TreeView
          nodes={filtroPredioid ? treeNodes.filter((n) => n.id === filtroPredioid) : treeNodes}
          onNodeClick={(node) => {
            const ambiente = data.find((a) => a.id === node.id);
            if (ambiente) openEdit(ambiente);
          }}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Ambiente" : "Novo Ambiente"}
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
            placeholder="Nome do ambiente"
          />
          <FormField
            label="Tipo"
            name="tipo"
            type="select"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as AmbienteTipo }))}
            required
            options={tipoOptions}
          />
          <FormField
            label="Capacidade"
            name="capacidade"
            type="number"
            value={String(form.capacidade ?? 0)}
            onChange={(e) => setForm((f) => ({ ...f, capacidade: Number(e.target.value) }))}
          />
          <FormField
            label="Prédio"
            name="predio_id"
            type="select"
            value={form.predio_id}
            onChange={(e) => setForm((f) => ({ ...f, predio_id: e.target.value }))}
            required
            options={predioOptions}
            placeholder="Selecione um prédio"
          />
        </div>
      </Modal>
    </div>
  );
}
