import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("chamados")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  const VALID_STATUSES = ["aberto", "em_andamento", "resolvido"];
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const VALID_PRIORIDADES = ["baixa", "media", "alta", "urgente"];
  if (body.prioridade && !VALID_PRIORIDADES.includes(body.prioridade)) {
    return NextResponse.json(
      { error: `prioridade must be one of: ${VALID_PRIORIDADES.join(", ")}` },
      { status: 400 }
    );
  }

  const updateFields: Record<string, unknown> = {};
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.titulo !== undefined) updateFields.titulo = body.titulo;
  if (body.descricao !== undefined) updateFields.descricao = body.descricao;
  if (body.prioridade !== undefined) updateFields.prioridade = body.prioridade;
  if (body.comentario_resolucao !== undefined) updateFields.comentario_resolucao = body.comentario_resolucao;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chamados")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("chamados").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
