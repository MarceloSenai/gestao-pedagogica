"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import type {
  Turma,
  TurmasTurno,
  Pessoa,
  Disciplina,
} from "@/types/database";

const turnoLabels: Record<TurmasTurno, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export default function TurmaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const turmaId = params.id;

  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [docente, setDocente] = useState<Pessoa | null>(null);
  const [alunos, setAlunos] = useState<Pessoa[]>([]);
  const [allAlunos, setAllAlunos] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matriculaModalOpen, setMatriculaModalOpen] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTurma = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [turmaRes, alunosRes, pessoasRes] = await Promise.all([
        fetch(`/api/turmas/${turmaId}`),
        fetch(`/api/turmas/${turmaId}/alunos`),
        fetch("/api/pessoas"),
      ]);
      if (!turmaRes.ok) throw new Error("Erro ao carregar turma");
      if (!alunosRes.ok) throw new Error("Erro ao carregar alunos");
      if (!pessoasRes.ok) throw new Error("Erro ao carregar pessoas");

      const turmaData: Turma = await turmaRes.json();
      const alunosData: Pessoa[] = await alunosRes.json();
      const pessoasData: Pessoa[] = await pessoasRes.json();

      setTurma(turmaData);
      setAlunos(alunosData);
      setAllAlunos(pessoasData.filter((p) => p.perfil === "aluno"));

      // Fetch disciplina
      const discRes = await fetch(`/api/disciplinas`);
      if (discRes.ok) {
        const disciplinas: Disciplina[] = await discRes.json();
        const disc = disciplinas.find((d) => d.id === turmaData.disciplina_id);
        setDisciplina(disc ?? null);
      }

      // Fetch docente if exists
      if (turmaData.docente_id) {
        const doc = pessoasData.find((p) => p.id === turmaData.docente_id);
        setDocente(doc ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    fetchTurma();
  }, [fetchTurma]);

  const enrolledIds = new Set(alunos.map((a) => a.id));
  const availableAlunos = allAlunos.filter((a) => !enrolledIds.has(a.id));
  const alunoOptions = availableAlunos.map((a) => ({
    value: a.id,
    label: a.nome,
  }));

  const handleMatricular = async () => {
    if (!selectedAlunoId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/turmas/${turmaId}/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aluno_id: selectedAlunoId }),
      });
      if (!res.ok) throw new Error("Erro ao matricular aluno");
      setMatriculaModalOpen(false);
      setSelectedAlunoId("");
      await fetchTurma();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao matricular");
    } finally {
      setSaving(false);
    }
  };

  const handleDesmatricular = async (alunoId: string) => {
    const aluno = alunos.find((a) => a.id === alunoId);
    if (!window.confirm(`Desmatricular "${aluno?.nome ?? alunoId}"?`)) return;
    try {
      const res = await fetch(`/api/turmas/${turmaId}/alunos?aluno_id=${alunoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao desmatricular");
      await fetchTurma();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao desmatricular");
    }
  };

  const alunoColumns: Column<Pessoa>[] = [
    { key: "nome", label: "Nome" },
    { key: "perfil", label: "Perfil" },
  ];

  if (loading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded bg-[var(--color-primary-light)]" /><div className="h-64 animate-pulse rounded-lg bg-[var(--color-primary-light)]" /></div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>;
  if (!turma) return <p className="p-6 text-gray-500">Turma não encontrada.</p>;

  const ocupacao = turma.vagas > 0 ? (alunos.length / turma.vagas) * 100 : 0;
  const cor =
    ocupacao > 90
      ? "bg-red-500"
      : ocupacao > 70
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => router.push("/turmas")}>
          \u2190 Voltar
        </Button>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-[var(--color-text)]">
          Turma: {disciplina?.nome ?? "\u2014"} \u2014 {turma.semestre}
        </h1>
      </div>

      {/* Turma Info */}
      <div className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Disciplina</p>
            <p className="text-[var(--color-text)]">{disciplina?.nome ?? "\u2014"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Docente</p>
            <p className="text-[var(--color-text)]">{docente?.nome ?? "\u2014"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Semestre</p>
            <p className="text-[var(--color-text)]">{turma.semestre}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Turno</p>
            <p className="text-[var(--color-text)]">{turnoLabels[turma.turno as TurmasTurno]}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Vagas</p>
            <p className="text-[var(--color-text)]">{turma.vagas}</p>
          </div>
        </div>

        {/* Lotacao bar */}
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">
            Lotação
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${cor} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(ocupacao, 100)}%` }}
            />
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">
            {alunos.length} / {turma.vagas} ({ocupacao.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Matriculas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Alunos Matriculados
          </h2>
          <Button
            variant="primary"
            onClick={() => setMatriculaModalOpen(true)}
          >
            Matricular Aluno
          </Button>
        </div>

        <DataTable<Pessoa>
          columns={alunoColumns}
          data={alunos}
          onDelete={handleDesmatricular}
          deleteLabel="Desmatricular"
          emptyMessage="Nenhum aluno matriculado nesta turma."
        />
      </div>

      {/* Matricula Modal */}
      <Modal
        open={matriculaModalOpen}
        onClose={() => setMatriculaModalOpen(false)}
        title="Matricular Aluno"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setMatriculaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleMatricular}
              loading={saving}
            >
              Matricular
            </Button>
          </div>
        }
      >
        <FormField
          label="Aluno"
          name="aluno_id"
          type="select"
          value={selectedAlunoId}
          onChange={(e) => setSelectedAlunoId(e.target.value)}
          required
          options={alunoOptions}
          placeholder="Selecione um aluno"
        />
      </Modal>
    </div>
  );
}
