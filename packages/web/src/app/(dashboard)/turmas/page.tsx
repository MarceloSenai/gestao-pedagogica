"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { confirm } from "@/components/ui/confirm-dialog";
import type {
  Turma,
  TurmaInsert,
  TurmasTurno,
  Disciplina,
  Pessoa,
  Curso,
} from "@/types/database";

const turnoLabels: Record<TurmasTurno, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

const turnoOptions = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
];

const emptyForm: TurmaInsert = {
  disciplina_id: "",
  docente_id: null,
  semestre: "",
  ano: new Date().getFullYear(),
  turno: "manha",
  vagas: 40,
};

export default function TurmasPage() {
  const router = useRouter();
  const [data, setData] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [form, setForm] = useState<TurmaInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [filtroCursoId, setFiltroCursoId] = useState("");

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [turmasRes, discRes, cursosRes, pessoasRes] = await Promise.all([
        fetch("/api/turmas", { signal }),
        fetch("/api/disciplinas", { signal }),
        fetch("/api/cursos", { signal }),
        fetch("/api/pessoas", { signal }),
      ]);
      if (!turmasRes.ok) throw new Error("Erro ao carregar turmas");
      if (!discRes.ok) throw new Error("Erro ao carregar disciplinas");
      if (!cursosRes.ok) throw new Error("Erro ao carregar cursos");
      if (!pessoasRes.ok) throw new Error("Erro ao carregar pessoas");

      setData(await turmasRes.json());
      setDisciplinas(await discRes.json());
      setCursos(await cursosRes.json());
      const pessoas: Pessoa[] = await pessoasRes.json();
      setDocentes(pessoas.filter((p) => p.perfil === "docente"));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  const discMap = Object.fromEntries(disciplinas.map((d) => [d.id, d]));
  const cursoMap = Object.fromEntries(cursos.map((c) => [c.id, c.nome]));
  const docenteMap = Object.fromEntries(docentes.map((p) => [p.id, p.nome]));

  const discOptions = disciplinas.map((d) => ({ value: d.id, label: d.nome }));
  const docenteOptions = [
    { value: "", label: "Nenhum" },
    ...docentes.map((p) => ({ value: p.id, label: p.nome })),
  ];
  const cursoFilterOptions = cursos.map((c) => ({
    value: c.id,
    label: c.nome,
  }));

  const semestres = Array.from(new Set(data.map((t) => t.semestre))).sort();

  const filteredData = data.filter((t) => {
    if (filtroSemestre && t.semestre !== filtroSemestre) return false;
    if (filtroCursoId) {
      const disc = discMap[t.disciplina_id];
      if (!disc || disc.curso_id !== filtroCursoId) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item: Turma) => {
    setEditing(item);
    setForm({
      disciplina_id: item.disciplina_id,
      docente_id: item.docente_id,
      semestre: item.semestre,
      ano: item.ano,
      turno: item.turno,
      vagas: item.vagas,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = data.find((t) => t.id === id);
    const disc = item ? discMap[item.disciplina_id] : null;
    const ok = await confirm({
      message: `Excluir turma "${disc?.nome ?? ""} - ${item?.semestre ?? id}"?`,
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/turmas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      await fetchData();
      toast("Turma excluída com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir", "error");
    }
  };

  const handleSubmit = async () => {
    if (!form.disciplina_id || !form.semestre.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/turmas/${editing.id}` : "/api/turmas";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplina_id: form.disciplina_id,
          docente_id: form.docente_id || null,
          semestre: form.semestre,
          ano: form.ano,
          turno: form.turno,
          vagas: form.vagas,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setModalOpen(false);
      await fetchData();
      toast("Turma salva com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Turma>[] = [
    {
      key: "disciplina_id",
      label: "Disciplina",
      render: (_v, item) => discMap[item.disciplina_id]?.nome ?? "\u2014",
    },
    {
      key: "disciplina_id" as keyof Turma,
      label: "Curso",
      render: (_v, item) => {
        const disc = discMap[item.disciplina_id];
        return disc ? (cursoMap[disc.curso_id] ?? "\u2014") : "\u2014";
      },
    },
    {
      key: "docente_id",
      label: "Docente",
      render: (_v, item) =>
        item.docente_id ? (docenteMap[item.docente_id] ?? "\u2014") : "\u2014",
    },
    { key: "semestre", label: "Semestre" },
    {
      key: "turno",
      label: "Turno",
      render: (_v, item) => turnoLabels[item.turno as TurmasTurno] ?? item.turno,
    },
    { key: "vagas", label: "Vagas" },
  ];

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">Turmas</h1>
        <Button variant="primary" onClick={openCreate}>
          Nova Turma
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Semestre:</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            value={filtroSemestre}
            onChange={(e) => setFiltroSemestre(e.target.value)}
          >
            <option value="">Todos</option>
            {semestres.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Curso:</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            value={filtroCursoId}
            onChange={(e) => setFiltroCursoId(e.target.value)}
          >
            <option value="">Todos</option>
            {cursoFilterOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[var(--color-primary-light)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]">
              {columns.map((col, idx) => (
                <th
                  key={`${String(col.key)}-${idx}`}
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
                  Nenhuma turma encontrada.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  {columns.map((col, idx) => (
                    <td key={`${String(col.key)}-${idx}`} className="px-4 py-3">
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
                        title="Ver Alunos"
                        onClick={() => router.push(`/turmas/${item.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
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
        title={editing ? "Editar Turma" : "Nova Turma"}
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
            label="Disciplina"
            name="disciplina_id"
            type="select"
            value={form.disciplina_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, disciplina_id: e.target.value }))
            }
            required
            options={discOptions}
            placeholder="Selecione uma disciplina"
          />
          <FormField
            label="Docente"
            name="docente_id"
            type="select"
            value={form.docente_id ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                docente_id: e.target.value || null,
              }))
            }
            options={docenteOptions}
            placeholder="Selecione um docente (opcional)"
          />
          <FormField
            label="Semestre"
            name="semestre"
            type="text"
            value={form.semestre}
            onChange={(e) =>
              setForm((f) => ({ ...f, semestre: e.target.value }))
            }
            required
            placeholder="Ex: 2026.1"
          />
          <FormField
            label="Ano"
            name="ano"
            type="number"
            value={String(form.ano)}
            onChange={(e) =>
              setForm((f) => ({ ...f, ano: Number(e.target.value) }))
            }
            required
          />
          <FormField
            label="Turno"
            name="turno"
            type="select"
            value={form.turno}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                turno: e.target.value as TurmasTurno,
              }))
            }
            required
            options={turnoOptions}
          />
          <FormField
            label="Vagas"
            name="vagas"
            type="number"
            value={String(form.vagas ?? 40)}
            onChange={(e) =>
              setForm((f) => ({ ...f, vagas: Number(e.target.value) }))
            }
            required
          />
        </div>
      </Modal>
    </div>
  );
}
