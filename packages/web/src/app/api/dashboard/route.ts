import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const [
    prediosRes,
    ambientesRes,
    recursosRes,
    cursosRes,
    disciplinasRes,
    pessoasRes,
    turmasRes,
    matriculasRes,
    chamadosRes,
    planejamentosRes,
    alocacoesRes,
    notificacoesRes,
  ] = await Promise.all([
    supabase.from("predios").select("id"),
    supabase.from("ambientes").select("id, status, tipo, capacidade"),
    supabase.from("recursos").select("id, status"),
    supabase.from("cursos").select("id, nome"),
    supabase.from("disciplinas").select("id, curso_id"),
    supabase.from("pessoas").select("id, perfil"),
    supabase.from("turmas").select("id, disciplina_id, vagas, turno, semestre, ano, disciplinas(curso_id)"),
    supabase.from("matriculas").select("turma_id"),
    supabase.from("chamados").select("id, status, prioridade"),
    supabase.from("planejamentos").select("id, semestre, ano, status"),
    supabase.from("alocacoes").select("id, planejamento_id, status"),
    supabase.from("notificacoes").select("id, lida"),
  ]);

  const predios = prediosRes.data ?? [];
  const ambientes = ambientesRes.data ?? [];
  const recursos = recursosRes.data ?? [];
  const cursos = cursosRes.data ?? [];
  const disciplinas = disciplinasRes.data ?? [];
  const pessoas = pessoasRes.data ?? [];
  const turmas = turmasRes.data ?? [];
  const matriculas = matriculasRes.data ?? [];
  const chamados = chamadosRes.data ?? [];
  const planejamentos = planejamentosRes.data ?? [];
  const alocacoes = alocacoesRes.data ?? [];
  const notificacoes = notificacoesRes.data ?? [];

  // --- Entity counts ---
  const counts = {
    predios: predios.length,
    ambientes: ambientes.length,
    recursos: recursos.length,
    cursos: cursos.length,
    disciplinas: disciplinas.length,
    pessoas: pessoas.length,
    turmas: turmas.length,
    matriculas: matriculas.length,
    chamados: chamados.length,
    planejamentos: planejamentos.length,
  };

  // --- Ambientes by status ---
  const ambientesByStatus: Record<string, number> = {};
  for (const a of ambientes) {
    ambientesByStatus[a.status] = (ambientesByStatus[a.status] ?? 0) + 1;
  }

  // --- Ambientes by tipo ---
  const ambientesByTipo: Record<string, number> = {};
  for (const a of ambientes) {
    ambientesByTipo[a.tipo] = (ambientesByTipo[a.tipo] ?? 0) + 1;
  }

  // --- Capacidade total ---
  const capacidadeTotal = ambientes.reduce(
    (sum, a) => sum + ((a.capacidade as number) ?? 0),
    0
  );

  // --- Recursos by status ---
  const recursosByStatus: Record<string, number> = {};
  for (const r of recursos) {
    recursosByStatus[r.status] = (recursosByStatus[r.status] ?? 0) + 1;
  }

  // --- Pessoas by perfil ---
  const pessoasByPerfil: Record<string, number> = {};
  for (const p of pessoas) {
    pessoasByPerfil[p.perfil] = (pessoasByPerfil[p.perfil] ?? 0) + 1;
  }

  // --- Turmas by turno ---
  const turmasByTurno: Record<string, number> = {};
  for (const t of turmas) {
    turmasByTurno[t.turno] = (turmasByTurno[t.turno] ?? 0) + 1;
  }

  // --- Matriculas per turma (occupation) ---
  const matriculasByTurma = new Map<string, number>();
  for (const m of matriculas) {
    matriculasByTurma.set(m.turma_id, (matriculasByTurma.get(m.turma_id) ?? 0) + 1);
  }

  const vagasTotal = turmas.reduce((s, t) => s + t.vagas, 0);
  const ocupacaoGeral = vagasTotal > 0 ? Math.round((matriculas.length / vagasTotal) * 100) : 0;

  // --- Demand per curso ---
  const demandaByCurso: Array<{ curso: string; turmas: number; alunos: number; vagas: number }> = [];
  const cursoMap = new Map(cursos.map((c) => [c.id, c.nome]));
  const cursoStats = new Map<string, { turmas: number; alunos: number; vagas: number }>();
  for (const t of turmas) {
    const disc = t.disciplinas as { curso_id: string } | null;
    const cursoId = disc?.curso_id;
    if (!cursoId) continue;
    const s = cursoStats.get(cursoId) ?? { turmas: 0, alunos: 0, vagas: 0 };
    s.turmas += 1;
    s.vagas += t.vagas;
    s.alunos += matriculasByTurma.get(t.id) ?? 0;
    cursoStats.set(cursoId, s);
  }
  for (const [cid, stats] of cursoStats) {
    demandaByCurso.push({ curso: cursoMap.get(cid) ?? cid, ...stats });
  }
  demandaByCurso.sort((a, b) => b.alunos - a.alunos);

  // --- Chamados ---
  const chamadosByStatus: Record<string, number> = { aberto: 0, em_andamento: 0, resolvido: 0 };
  const chamadosByPrioridade: Record<string, number> = { baixa: 0, media: 0, alta: 0, urgente: 0 };
  for (const c of chamados) {
    if (c.status in chamadosByStatus) chamadosByStatus[c.status]++;
    if (c.prioridade in chamadosByPrioridade) chamadosByPrioridade[c.prioridade]++;
  }

  // --- Planejamento mais recente ---
  const latestPlan = planejamentos.length > 0
    ? planejamentos.sort((a, b) => b.ano - a.ano || b.semestre.localeCompare(a.semestre))[0]
    : null;

  let alocacaoResumo = { total: 0, alocadas: 0, nao_alocadas: 0, conflitos: 0, taxa_sucesso: 0 };
  if (latestPlan) {
    const planAlocs = alocacoes.filter((a) => a.planejamento_id === latestPlan.id);
    const alocadas = planAlocs.filter((a) => a.status === "alocada").length;
    const naoAlocadas = planAlocs.filter((a) => a.status === "nao_alocada").length;
    const conflitos = planAlocs.filter((a) => a.status === "conflito").length;
    alocacaoResumo = {
      total: planAlocs.length,
      alocadas,
      nao_alocadas: naoAlocadas,
      conflitos,
      taxa_sucesso: planAlocs.length > 0 ? Math.round((alocadas / planAlocs.length) * 100) : 0,
    };
  }

  // --- Notificações ---
  const notifNaoLidas = notificacoes.filter((n) => !n.lida).length;

  return NextResponse.json({
    counts,
    ambientesByStatus,
    ambientesByTipo,
    capacidadeTotal,
    recursosByStatus,
    pessoasByPerfil,
    turmasByTurno,
    vagasTotal,
    ocupacaoGeral,
    demandaByCurso,
    chamadosByStatus,
    chamadosByPrioridade,
    latestPlan,
    alocacaoResumo,
    notifNaoLidas,
  });
}
