import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("planejamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Check status
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
      { error: "Só é possível excluir planejamentos com status 'rascunho'" },
      { status: 400 }
    );
  }

  // Delete alocacoes first
  await supabase.from("alocacoes").delete().eq("planejamento_id", id);

  const { error } = await supabase
    .from("planejamentos")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
