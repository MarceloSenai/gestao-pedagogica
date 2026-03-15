import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const [ambientesRes, chamadosRes, recursosRes, turmasRes, matriculasRes] =
    await Promise.all([
      supabase.from("ambientes").select("id, status"),
      supabase.from("chamados").select("id, status"),
      supabase.from("recursos").select("id, status"),
      supabase.from("turmas").select("id, vagas"),
      supabase.from("matriculas").select("id"),
    ]);

  const ambientes = ambientesRes.data ?? [];
  const chamados = chamadosRes.data ?? [];
  const recursos = recursosRes.data ?? [];
  const turmas = turmasRes.data ?? [];
  const matriculas = matriculasRes.data ?? [];

  const ambientesAtivos = ambientes.filter((a) => a.status === "ativo").length;
  const totalAmbientes = ambientes.length;
  const ocupacaoMedia =
    totalAmbientes > 0 ? (ambientesAtivos / totalAmbientes) * 100 : 0;

  const chamadosAbertos = chamados.filter(
    (c) => c.status === "aberto" || c.status === "em_andamento"
  ).length;

  const recursosIndisponiveis = recursos.filter(
    (r) => r.status === "indisponivel" || r.status === "em_manutencao"
  ).length;

  const kpis = {
    ambientes_ativos: ambientesAtivos,
    ocupacao_media: Math.round(ocupacaoMedia * 10) / 10,
    chamados_abertos: chamadosAbertos,
    recursos_indisponiveis: recursosIndisponiveis,
    total_turmas: turmas.length,
    total_alunos: matriculas.length,
  };

  return NextResponse.json(kpis);
}
