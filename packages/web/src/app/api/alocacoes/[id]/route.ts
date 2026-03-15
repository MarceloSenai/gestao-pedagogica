import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  // Get the alocacao with its planejamento
  const { data: alocacao, error: fetchError } = await supabase
    .from("alocacoes")
    .select("*, planejamentos(status)")
    .eq("id", id)
    .single();

  if (fetchError) {
    const status = fetchError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: fetchError.message }, { status });
  }

  const planejamento = alocacao.planejamentos as { status: string } | null;
  if (planejamento?.status !== "rascunho") {
    return NextResponse.json(
      { error: "Só é possível ajustar alocações em planejamentos com status 'rascunho'" },
      { status: 400 }
    );
  }

  // Update ambiente_id
  const ambienteId = body.ambiente_id === null ? null : body.ambiente_id;
  const newStatus = ambienteId ? "alocada" : "nao_alocada";

  const { data, error } = await supabase
    .from("alocacoes")
    .update({
      ambiente_id: ambienteId,
      status: newStatus,
      motivo: ambienteId ? null : "Ajuste manual — ambiente removido",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
