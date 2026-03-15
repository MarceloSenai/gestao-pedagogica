"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { confirm } from "@/components/ui/confirm-dialog";
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
  const [filtroStatus, setFiltroStatus] = useState("");

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
    const ok = await confirm({ message: `Excluir recurso "${item?.nome ?? id}"?`, confirmLabel: "Excluir" });
    if (!ok) return;
    try {
      const res = await fetch(`/api/recursos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
      toast("Recurso excluído com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir", "error");
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
      toast("Recurso salvo com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.filter((r) => {
    if (filtroStatus && (r.status ?? "disponivel") !== filtroStatus) return false;
    return true;
  });

  const columns: Column<Recurso>[] = [
    { key: "nome", label: "Nome" },
    { key: "quantidade", label: "Quantidade" },
    {
      key: "status",
      label: "Status",
      render: (_v, item) => (
        <StatusBadge status={item.status ?? "disponivel"} variant="recurso" />
      ),
    },
  ];

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">Recursos</h1>
        <Button variant="primary" onClick={openCreate}>
          Novo Recurso
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="em_uso">Em Uso</option>
            <option value="em_manutencao">Manutenção</option>
            <option value="indisponivel">Indisponível</option>
          </select>
        </div>
      </div>

      <DataTable<Recurso>
        columns={columns}
        data={filteredData}
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
