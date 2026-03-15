import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const semestre = request.nextUrl.searchParams.get("semestre");

  const [cursosRes, turmasRes, matriculasRes] = await Promise.all([
    supabase.from("cursos").select("id, nome").order("nome"),
    supabase.from("turmas").select("id, disciplina_id, vagas, disciplinas(curso_id)"),
    supabase.from("matriculas").select("turma_id"),
  ]);

  if (cursosRes.error) {
    return NextResponse.json({ error: cursosRes.error.message }, { status: 500 });
  }
  if (turmasRes.error) {
    return NextResponse.json({ error: turmasRes.error.message }, { status: 500 });
  }
  if (matriculasRes.error) {
    return NextResponse.json({ error: matriculasRes.error.message }, { status: 500 });
  }

  const cursos = cursosRes.data ?? [];
  const turmas = turmasRes.data ?? [];
  const matriculas = matriculasRes.data ?? [];

  // Count matriculas per turma
  const matriculasPorTurma = new Map<string, number>();
  for (const m of matriculas) {
    matriculasPorTurma.set(m.turma_id, (matriculasPorTurma.get(m.turma_id) ?? 0) + 1);
  }

  // Group turmas by curso_id
  const turmasPorCurso = new Map<string, { turmaCount: number; vagas: number; alunos: number }>();
  for (const turma of turmas) {
    const disciplinas = turma.disciplinas as { curso_id: string } | null;
    const cursoId = disciplinas?.curso_id;
    if (!cursoId) continue;

    // Filter by semestre if provided
    if (semestre) {
      const turmaTyped = turma as unknown as { semestre?: string };
      if (turmaTyped.semestre && turmaTyped.semestre !== semestre) continue;
    }

    const current = turmasPorCurso.get(cursoId) ?? { turmaCount: 0, vagas: 0, alunos: 0 };
    current.turmaCount += 1;
    current.vagas += turma.vagas;
    current.alunos += matriculasPorTurma.get(turma.id) ?? 0;
    turmasPorCurso.set(cursoId, current);
  }

  const result = cursos.map((curso) => {
    const stats = turmasPorCurso.get(curso.id) ?? { turmaCount: 0, vagas: 0, alunos: 0 };
    const ocupacao = stats.vagas > 0 ? (stats.alunos / stats.vagas) * 100 : 0;
    return {
      curso_id: curso.id,
      curso: curso.nome,
      turmas: stats.turmaCount,
      alunos: stats.alunos,
      vagas: stats.vagas,
      ocupacao,
    };
  });

  return NextResponse.json(result);
}
