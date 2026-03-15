import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/create";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Check current status
  const { data: plan, error: fetchError } = await supabase
    .from("planejamentos")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    const status = fetchError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: fetchError.message }, { status });
  }

  if (plan.status !== "rascunho") {
    return NextResponse.json(
      { error: "Só é possível publicar planejamentos com status 'rascunho'" },
      { status: 400 }
    );
  }

  // Update status
  const { data, error } = await supabase
    .from("planejamentos")
    .update({ status: "publicado" })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification(supabase, {
    tipo: "sistema",
    titulo: "Planejamento publicado",
    mensagem: `O planejamento ${(data as { semestre: string }).semestre}/${(data as { ano: number }).ano} foi publicado com sucesso.`,
    referencia_tipo: "planejamento",
    referencia_id: id,
  });

  return NextResponse.json(data);
}
