"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  Chamado,
  ChamadoInsert,
  Ambiente,
  Recurso,
  ChamadoTipo,
  ChamadoPrioridade,
  ChamadoStatus,
} from "@/types/database";

const tipoOptions = [
  { value: "ambiente", label: "Ambiente" },
  { value: "recurso", label: "Recurso" },
];

const prioridadeOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const statusOptions = [
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "resolvido", label: "Resolvido" },
];

const emptyForm: ChamadoInsert = {
  tipo: "ambiente",
  referencia_id: "",
  titulo: "",
  descricao: "",
  prioridade: "media",
};

export default function ChamadosPage() {
  const [data, setData] = useState<Chamado[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Chamado | null>(null);
  const [form, setForm] = useState<ChamadoInsert>({ ...emptyForm });
  const [editStatus, setEditStatus] = useState<ChamadoStatus>("aberto");
  const [editComentario, setEditComentario] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chamadosRes, ambientesRes, recursosRes] = await Promise.all([
        fetch("/api/chamados"),
        fetch("/api/ambientes"),
        fetch("/api/recursos"),
      ]);
      if (!chamadosRes.ok) throw new Error("Erro ao carregar chamados");
      if (!ambientesRes.ok) throw new Error("Erro ao carregar ambientes");
      if (!recursosRes.ok) throw new Error("Erro ao carregar recursos");
      setData(await chamadosRes.json());
      setAmbientes(await ambientesRes.json());
      setRecursos(await recursosRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const referenciaOptions =
    form.tipo === "ambiente"
      ? ambientes.map((a) => ({ value: a.id, label: a.nome }))
      : recursos.map((r) => ({ value: r.id, label: r.nome }));

  const referenciaMap: Record<string, string> = {};
  for (const a of ambientes) referenciaMap[a.id] = a.nome;
  for (const r of recursos) referenciaMap[r.id] = r.nome;

  const filteredData = data.filter((c) => {
    if (filtroStatus && c.status !== filtroStatus) return false;
    if (filtroPrioridade && c.prioridade !== filtroPrioridade) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setEditStatus("aberto");
    setEditComentario("");
    setModalOpen(true);
  };

  const openEdit = (item: Chamado) => {
    setEditing(item);
    setForm({
      tipo: item.tipo as ChamadoTipo,
      referencia_id: item.referencia_id,
      titulo: item.titulo,
      descricao: item.descricao ?? "",
      prioridade: item.prioridade as ChamadoPrioridade,
    });
    setEditStatus(item.status as ChamadoStatus);
    setEditComentario(item.comentario_resolucao ?? "");
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (!window.confirm(`Excluir chamado "${item?.titulo ?? id}"?`)) return;
    try {
      const res = await fetch(`/api/chamados/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const handleSubmit = async () => {
    if (!form.titulo?.trim() || !form.referencia_id) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/chamados/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: form.titulo,
            tipo: form.tipo,
            referencia_id: form.referencia_id,
            descricao: form.descricao || null,
            prioridade: form.prioridade,
            status: editStatus,
            comentario_resolucao: editStatus === "resolvido" ? editComentario || null : null,
          }),
        });
        if (!res.ok) throw new Error("Erro ao salvar");
      } else {
        const res = await fetch("/api/chamados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Erro ao salvar");
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Chamado>[] = [
    { key: "titulo", label: "Título" },
    {
      key: "tipo",
      label: "Tipo",
      render: (_v, item) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {item.tipo === "ambiente" ? "Ambiente" : "Recurso"}
        </span>
      ),
    },
    {
      key: "prioridade",
      label: "Prioridade",
      render: (_v, item) => (
        <StatusBadge status={item.prioridade} variant="prioridade" />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_v, item) => (
        <StatusBadge status={item.status} variant="chamado" />
      ),
    },
    {
      key: "created_at",
      label: "Data",
      render: (_v, item) =>
        new Date(item.created_at).toLocaleDateString("pt-BR"),
    },
  ];

  if (loading)
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" />
        <div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
          Chamados
        </h1>
        <Button variant="primary" onClick={openCreate}>
          Novo Chamado
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
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Prioridade:
          </label>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
          >
            <option value="">Todas</option>
            {prioridadeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable<Chamado>
        columns={columns}
        data={filteredData}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Chamado" : "Novo Chamado"}
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
            label="Tipo"
            name="tipo"
            type="select"
            value={form.tipo}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tipo: e.target.value as ChamadoTipo,
                referencia_id: "",
              }))
            }
            required
            options={tipoOptions}
          />
          <FormField
            label={form.tipo === "ambiente" ? "Ambiente" : "Recurso"}
            name="referencia_id"
            type="select"
            value={form.referencia_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, referencia_id: e.target.value }))
            }
            required
            options={referenciaOptions}
            placeholder={`Selecione um ${form.tipo === "ambiente" ? "ambiente" : "recurso"}`}
          />
          <FormField
            label="Título"
            name="titulo"
            type="text"
            value={form.titulo}
            onChange={(e) =>
              setForm((f) => ({ ...f, titulo: e.target.value }))
            }
            required
            placeholder="Título do chamado"
          />
          <FormField
            label="Descrição"
            name="descricao"
            type="textarea"
            value={form.descricao ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, descricao: e.target.value }))
            }
            placeholder="Descrição detalhada do problema"
          />
          <FormField
            label="Prioridade"
            name="prioridade"
            type="select"
            value={form.prioridade ?? "media"}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                prioridade: e.target.value as ChamadoPrioridade,
              }))
            }
            required
            options={prioridadeOptions}
          />
          {editing && (
            <>
              <FormField
                label="Status"
                name="status"
                type="select"
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as ChamadoStatus)
                }
                required
                options={statusOptions}
              />
              {editStatus === "resolvido" && (
                <FormField
                  label="Comentário da Resolução"
                  name="comentario_resolucao"
                  type="textarea"
                  value={editComentario}
                  onChange={(e) => setEditComentario(e.target.value)}
                  placeholder="Descreva como o problema foi resolvido"
                />
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
