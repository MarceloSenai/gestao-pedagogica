import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.from("chamados").select("status, prioridade");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const por_status: Record<string, number> = { aberto: 0, em_andamento: 0, resolvido: 0 };
  const por_prioridade: Record<string, number> = { baixa: 0, media: 0, alta: 0, urgente: 0 };

  for (const row of data ?? []) {
    if (row.status in por_status) por_status[row.status]++;
    if (row.prioridade in por_prioridade) por_prioridade[row.prioridade]++;
  }

  return NextResponse.json({
    por_status,
    por_prioridade,
    total_abertos: por_status.aberto,
  });
}
