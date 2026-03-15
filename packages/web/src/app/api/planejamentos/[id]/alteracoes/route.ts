import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Planejamento } from "@/types/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("alteracoes_extraordinarias")
    .select("*")
    .eq("planejamento_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Verify planejamento is publicado
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

  if (planejamento.status !== "publicado") {
    return NextResponse.json(
      {
        error:
          "Alteracoes extraordinarias so podem ser criadas em planejamentos publicados",
      },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { tipo, descricao, justificativa, turma_id, ambiente_anterior_id, ambiente_novo_id } = body;

  if (!tipo || !descricao || !justificativa) {
    return NextResponse.json(
      { error: "Campos obrigatorios: tipo, descricao, justificativa" },
      { status: 400 },
    );
  }

  if (!["adicionar", "remover", "modificar"].includes(tipo)) {
    return NextResponse.json(
      { error: "Tipo deve ser: adicionar, remover ou modificar" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("alteracoes_extraordinarias")
    .insert({
      planejamento_id: id,
      tipo,
      descricao,
      justificativa,
      turma_id: turma_id ?? null,
      ambiente_anterior_id: ambiente_anterior_id ?? null,
      ambiente_novo_id: ambiente_novo_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
