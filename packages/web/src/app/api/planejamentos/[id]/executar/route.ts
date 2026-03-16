import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  runAllocation,
  analyzeBottlenecks,
  type TurmaInput,
  type AmbienteInput,
} from "@/lib/allocation/engine";
import { createNotification } from "@/lib/notifications/create";
import type {
  Planejamento,
  Turma,
  Ambiente,
  AmbienteRecurso,
} from "@/types/database";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // 1. Get planejamento and verify status
  const { data: rawPlan, error: planError } = await supabase
    .from("planejamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (planError) {
    const status = planError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: planError.message }, { status });
  }

  const planejamento = rawPlan as unknown as Planejamento;

  if (planejamento.status !== "rascunho") {
    return NextResponse.json(
      { error: "Só é possível executar alocação em planejamentos com status 'rascunho'" },
      { status: 400 }
    );
  }

  // 2. Fetch turmas for this semestre/ano
  const { data: rawTurmas, error: turmasError } = await supabase
    .from("turmas")
    .select("*")
    .eq("semestre", planejamento.semestre)
    .eq("ano", planejamento.ano);

  if (turmasError) {
    return NextResponse.json({ error: turmasError.message }, { status: 500 });
  }

  const turmas = (rawTurmas ?? []) as unknown as Turma[];

  if (turmas.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma turma encontrada para este semestre/ano" },
      { status: 400 }
    );
  }

  // Count matriculas for each turma
  const turmaIds = turmas.map((t) => t.id);
  const { data: rawMatriculas } = await supabase
    .from("matriculas")
    .select("turma_id")
    .in("turma_id", turmaIds);

  const matriculas = (rawMatriculas ?? []) as unknown as { turma_id: string }[];
  const matriculasCount = new Map<string, number>();
  for (const m of matriculas) {
    matriculasCount.set(m.turma_id, (matriculasCount.get(m.turma_id) ?? 0) + 1);
  }

  // 3. Fetch active ambientes with their recursos
  const { data: rawAmbientes, error: ambError } = await supabase
    .from("ambientes")
    .select("*")
    .eq("status", "ativo");

  if (ambError) {
    return NextResponse.json({ error: ambError.message }, { status: 500 });
  }

  const ambientes = (rawAmbientes ?? []) as unknown as Ambiente[];

  const { data: rawAmbRecursos } = await supabase
    .from("ambiente_recursos")
    .select("*");

  const ambRecursos = (rawAmbRecursos ?? []) as unknown as AmbienteRecurso[];

  // Build recurso map per ambiente
  const recursosByAmbiente = new Map<string, string[]>();
  for (const ar of ambRecursos) {
    const list = recursosByAmbiente.get(ar.ambiente_id) ?? [];
    list.push(ar.recurso_id);
    recursosByAmbiente.set(ar.ambiente_id, list);
  }

  // 4. Fetch disciplina_recursos from junction table
  const disciplinaIds = [...new Set(turmas.map((t) => t.disciplina_id))];
  const recursosByDisciplina = new Map<string, string[]>();

  if (disciplinaIds.length > 0) {
    const { data: rawDR } = await supabase
      .from("disciplina_recursos")
      .select("disciplina_id, recurso_id")
      .in("disciplina_id", disciplinaIds);

    for (const row of (rawDR ?? []) as { disciplina_id: string; recurso_id: string }[]) {
      const list = recursosByDisciplina.get(row.disciplina_id) ?? [];
      list.push(row.recurso_id);
      recursosByDisciplina.set(row.disciplina_id, list);
    }
  }

  // Build TurmaInput[] and AmbienteInput[]
  const turmaInputs: TurmaInput[] = turmas.map((t) => ({
    id: t.id,
    disciplina_id: t.disciplina_id,
    docente_id: t.docente_id,
    turno: t.turno,
    vagas: t.vagas,
    matriculas_count: matriculasCount.get(t.id) ?? 0,
    requisitos_recursos: recursosByDisciplina.get(t.disciplina_id) ?? [],
  }));

  const ambienteInputs: AmbienteInput[] = ambientes.map((a) => ({
    id: a.id,
    nome: a.nome,
    tipo: a.tipo,
    capacidade: a.capacidade ?? 0,
    status: a.status,
    recurso_ids: recursosByAmbiente.get(a.id) ?? [],
  }));

  // 5. Run allocation engine
  const results = runAllocation(turmaInputs, ambienteInputs);

  // 6. Delete existing alocacoes for this planejamento (re-run support)
  await supabase.from("alocacoes").delete().eq("planejamento_id", id);

  // 7. Insert results
  const inserts = results.map((r) => ({
    planejamento_id: id,
    turma_id: r.turma_id,
    ambiente_id: r.ambiente_id,
    status: r.status,
    motivo: r.motivo,
    score: r.score,
  }));

  const { error: insertError } = await supabase
    .from("alocacoes")
    .insert(inserts);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 8. Analyze bottlenecks (Story 10.0 — Modo Consultivo)
  const bottlenecks = analyzeBottlenecks(turmaInputs, ambienteInputs, results);

  // 9. Return results + summary + bottlenecks
  const alocadas = results.filter((r) => r.status === "alocada").length;
  const naoAlocadas = results.filter((r) => r.status === "nao_alocada").length;
  const conflitos = results.filter((r) => r.status === "conflito").length;

  const taxaSucesso = results.length > 0
    ? Math.round((alocadas / results.length) * 100)
    : 0;

  await createNotification(supabase, {
    tipo: conflitos > 0 ? "conflito" : "info",
    titulo: "Alocação executada",
    mensagem: `Planejamento ${planejamento.semestre}/${planejamento.ano}: ${alocadas} alocadas, ${naoAlocadas} não alocadas, ${conflitos} conflitos (${taxaSucesso}% sucesso)`,
    referencia_tipo: "planejamento",
    referencia_id: id,
  });

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      alocadas,
      nao_alocadas: naoAlocadas,
      conflitos,
      taxa_sucesso: taxaSucesso,
    },
    bottlenecks,
  });
}
