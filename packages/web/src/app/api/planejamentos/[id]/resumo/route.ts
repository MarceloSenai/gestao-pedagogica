import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("alocacoes")
    .select("status")
    .eq("planejamento_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = data?.length ?? 0;
  const alocadas = data?.filter((a) => a.status === "alocada").length ?? 0;
  const nao_alocadas = data?.filter((a) => a.status === "nao_alocada").length ?? 0;
  const conflitos = data?.filter((a) => a.status === "conflito").length ?? 0;

  return NextResponse.json({
    total,
    alocadas,
    nao_alocadas,
    conflitos,
    taxa_sucesso: total > 0 ? Math.round((alocadas / total) * 100) : 0,
  });
}
