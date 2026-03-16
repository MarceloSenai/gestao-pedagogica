import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  runAllocation,
  analyzeBottlenecks,
  type TurmaInput,
  type AmbienteInput,
  type SlotInput,
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

  // 2. Fetch turmas + disciplinas (need aulas_semana)
  const { data: rawTurmas, error: turmasError } = await supabase
    .from("turmas")
    .select("*, disciplinas(id, aulas_semana)")
    .eq("semestre", planejamento.semestre)
    .eq("ano", planejamento.ano);

  if (turmasError) {
    return NextResponse.json({ error: turmasError.message }, { status: 500 });
  }

  const turmas = (rawTurmas ?? []) as unknown as (Turma & { disciplinas: { id: string; aulas_semana: number } | null })[];

  if (turmas.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma turma encontrada para este semestre/ano" },
      { status: 400 }
    );
  }

  // Count matriculas
  const turmaIds = turmas.map((t) => t.id);
  const { data: rawMatriculas } = await supabase
    .from("matriculas")
    .select("turma_id")
    .in("turma_id", turmaIds);

  const matriculasCount = new Map<string, number>();
  for (const m of (rawMatriculas ?? []) as { turma_id: string }[]) {
    matriculasCount.set(m.turma_id, (matriculasCount.get(m.turma_id) ?? 0) + 1);
  }

  // 3. Fetch active ambientes with recursos
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

  const recursosByAmbiente = new Map<string, string[]>();
  for (const ar of ambRecursos) {
    const list = recursosByAmbiente.get(ar.ambiente_id) ?? [];
    list.push(ar.recurso_id);
    recursosByAmbiente.set(ar.ambiente_id, list);
  }

  // 4. Fetch disciplina_recursos
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

  // 5. Fetch slots_horario
  const { data: rawSlots } = await supabase
    .from("slots_horario")
    .select("*")
    .order("turno")
    .order("ordem");

  const slots: SlotInput[] = ((rawSlots ?? []) as { id: string; turno: string; ordem: number; hora_inicio: string; hora_fim: string; label: string }[]).map((s) => ({
    id: s.id,
    turno: s.turno,
    ordem: s.ordem,
    hora_inicio: s.hora_inicio,
    hora_fim: s.hora_fim,
    label: s.label,
  }));

  // 6. Build inputs
  const turmaInputs: TurmaInput[] = turmas.map((t) => ({
    id: t.id,
    disciplina_id: t.disciplina_id,
    docente_id: t.docente_id,
    turno: t.turno,
    vagas: t.vagas,
    matriculas_count: matriculasCount.get(t.id) ?? 0,
    requisitos_recursos: recursosByDisciplina.get(t.disciplina_id) ?? [],
    aulas_semana: t.disciplinas?.aulas_semana ?? 2,
  }));

  const ambienteInputs: AmbienteInput[] = ambientes.map((a) => ({
    id: a.id,
    nome: a.nome,
    tipo: a.tipo,
    capacidade: a.capacidade ?? 0,
    status: a.status,
    recurso_ids: recursosByAmbiente.get(a.id) ?? [],
  }));

  // 7. Run allocation engine (granular if slots exist, legacy otherwise)
  const results = runAllocation(turmaInputs, ambienteInputs, slots.length > 0 ? slots : undefined);

  // 8. Delete existing alocacoes + horarios (re-run support, cascade deletes horarios_aula)
  await supabase.from("alocacoes").delete().eq("planejamento_id", id);

  // 9. Insert alocacoes
  const alocInserts = results.map((r) => ({
    planejamento_id: id,
    turma_id: r.turma_id,
    ambiente_id: r.ambiente_id,
    status: r.status === "parcial" ? "nao_alocada" as const : r.status === "conflito" ? "conflito" as const : r.status === "nao_alocada" ? "nao_alocada" as const : "alocada" as const,
    motivo: r.motivo,
    score: r.score,
  }));

  const { data: insertedAlocs, error: insertError } = await supabase
    .from("alocacoes")
    .insert(alocInserts)
    .select("id, turma_id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 10. Insert horarios_aula for granular results
  const alocMap = new Map<string, string>();
  for (const a of (insertedAlocs ?? []) as { id: string; turma_id: string }[]) {
    alocMap.set(a.turma_id, a.id);
  }

  const horarioInserts: Array<{
    alocacao_id: string;
    dia_semana: number;
    slot_id: string;
    ambiente_id: string;
  }> = [];

  for (const r of results) {
    if (r.horarios.length === 0) continue;
    const alocId = alocMap.get(r.turma_id);
    if (!alocId) continue;
    for (const h of r.horarios) {
      horarioInserts.push({
        alocacao_id: alocId,
        dia_semana: h.dia_semana,
        slot_id: h.slot_id,
        ambiente_id: h.ambiente_id,
      });
    }
  }

  if (horarioInserts.length > 0) {
    const { error: horarioError } = await supabase
      .from("horarios_aula")
      .insert(horarioInserts);

    if (horarioError) {
      return NextResponse.json({ error: `Alocações salvas mas erro nos horários: ${horarioError.message}` }, { status: 500 });
    }
  }

  // 11. Bottleneck analysis
  const bottlenecks = analyzeBottlenecks(turmaInputs, ambienteInputs, results);

  // 12. Summary
  const alocadas = results.filter((r) => r.status === "alocada").length;
  const parciais = results.filter((r) => r.status === "parcial").length;
  const naoAlocadas = results.filter((r) => r.status === "nao_alocada").length;
  const conflitos = results.filter((r) => r.status === "conflito").length;

  const taxaSucesso = results.length > 0
    ? Math.round((alocadas / results.length) * 100)
    : 0;

  await createNotification(supabase, {
    tipo: conflitos > 0 ? "conflito" : "info",
    titulo: "Alocação executada",
    mensagem: `Planejamento ${planejamento.semestre}/${planejamento.ano}: ${alocadas} alocadas, ${parciais} parciais, ${naoAlocadas} não alocadas, ${conflitos} conflitos (${taxaSucesso}% sucesso). ${horarioInserts.length} horários gerados.`,
    referencia_tipo: "planejamento",
    referencia_id: id,
  });

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      alocadas,
      parciais,
      nao_alocadas: naoAlocadas,
      conflitos,
      taxa_sucesso: taxaSucesso,
      horarios_gerados: horarioInserts.length,
    },
    bottlenecks,
  });
}
