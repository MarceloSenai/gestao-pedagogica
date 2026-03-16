"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { confirm } from "@/components/ui/confirm-dialog";
import type { Disciplina, DisciplinaInsert, Curso, Recurso } from "@/types/database";

interface RequisitoItem {
  recurso_id: string;
  quantidade: number;
}

const emptyForm: DisciplinaInsert = {
  nome: "",
  curso_id: "",
  carga_horaria: 0,
  requisitos_recursos: null,
};

export default function DisciplinasPageWrapper() {
  return (
    <Suspense fallback={<div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>}>
      <DisciplinasPage />
    </Suspense>
  );
}

function DisciplinasPage() {
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
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqEditing, setReqEditing] = useState<Disciplina | null>(null);
  const [reqItems, setReqItems] = useState<RequisitoItem[]>([]);
  const [savingReq, setSavingReq] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [discRes, cursoRes, recRes] = await Promise.all([
        fetch("/api/disciplinas"),
        fetch("/api/cursos"),
        fetch("/api/recursos"),
      ]);
      if (!discRes.ok) throw new Error("Erro ao carregar disciplinas");
      if (!cursoRes.ok) throw new Error("Erro ao carregar cursos");
      if (!recRes.ok) throw new Error("Erro ao carregar recursos");
      setData(await discRes.json());
      setCursos(await cursoRes.json());
      setRecursos(await recRes.json());
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
    const ok = await confirm({ message: `Excluir disciplina "${item?.nome ?? id}"?`, confirmLabel: "Excluir" });
    if (!ok) return;
    try {
      const res = await fetch(`/api/disciplinas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
      toast("Disciplina excluída com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir", "error");
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
      toast("Disciplina salva com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const openReqModal = async (item: Disciplina) => {
    setReqEditing(item);
    setReqItems([]);
    setReqModalOpen(true);
    try {
      const res = await fetch(`/api/disciplinas/${item.id}/recursos`);
      if (res.ok) {
        const items: RequisitoItem[] = await res.json();
        setReqItems(items);
      }
    } catch {
      // Fallback to empty — user can still add items
    }
  };

  const toggleReqItem = (recursoId: string, checked: boolean) => {
    if (checked) {
      setReqItems((prev) => [...prev, { recurso_id: recursoId, quantidade: 1 }]);
    } else {
      setReqItems((prev) => prev.filter((r) => r.recurso_id !== recursoId));
    }
  };

  const updateReqQty = (recursoId: string, quantidade: number) => {
    setReqItems((prev) =>
      prev.map((r) =>
        r.recurso_id === recursoId ? { ...r, quantidade } : r
      )
    );
  };

  const handleSaveRequisitos = async () => {
    if (!reqEditing) return;
    setSavingReq(true);
    try {
      const res = await fetch(`/api/disciplinas/${reqEditing.id}/recursos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqItems),
      });
      if (!res.ok) throw new Error("Erro ao salvar requisitos");
      setReqModalOpen(false);
      await fetchData();
      toast("Requisitos salvos com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar requisitos", "error");
    } finally {
      setSavingReq(false);
    }
  };

  const columns: Column<Disciplina>[] = [
    { key: "nome", label: "Nome" },
    {
      key: "curso_id",
      label: "Curso",
      render: (_v, item) => cursoMap[item.curso_id] ?? "\u2014",
    },
    { key: "carga_horaria", label: "Carga Horária" },
  ];

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">Disciplinas</h1>
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

      <div className="overflow-x-auto rounded border border-[var(--color-primary-light)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left font-medium text-[var(--color-text)]"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium text-[var(--color-text)]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Requisitos"
                        onClick={() => openReqModal(item)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Editar"
                        onClick={() => openEdit(item)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        title="Excluir"
                        onClick={() => handleDelete(item.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </Button>
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

      {/* Requisitos de Recursos Modal */}
      <Modal
        open={reqModalOpen}
        onClose={() => setReqModalOpen(false)}
        title={`Requisitos de Recursos — ${reqEditing?.nome ?? ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReqModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveRequisitos}
              loading={savingReq}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recursos.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Nenhum recurso cadastrado.
            </p>
          ) : (
            recursos.map((rec) => {
              const reqItem = reqItems.find((r) => r.recurso_id === rec.id);
              const checked = !!reqItem;
              return (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 rounded border border-[var(--color-primary-light)] p-3"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleReqItem(rec.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="flex-1 text-sm text-[var(--color-text)]">
                    {rec.nome}
                  </span>
                  {checked && (
                    <input
                      type="number"
                      min={1}
                      value={reqItem?.quantidade ?? 1}
                      onChange={(e) =>
                        updateReqQty(rec.id, Number(e.target.value) || 1)
                      }
                      className="w-20 rounded border border-[var(--color-primary-light)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)]"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
