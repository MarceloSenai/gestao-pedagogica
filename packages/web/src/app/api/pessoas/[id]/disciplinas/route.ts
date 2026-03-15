import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("pessoa_disciplinas")
    .select("*, disciplinas(*)")
    .eq("pessoa_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.disciplina_id) {
    return NextResponse.json({ error: "disciplina_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pessoa_disciplinas")
    .insert({
      pessoa_id: id,
      disciplina_id: body.disciplina_id,
      papel: body.papel ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const disciplinaId = request.nextUrl.searchParams.get("disciplina_id");

  if (!disciplinaId) {
    return NextResponse.json({ error: "disciplina_id query param is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("pessoa_disciplinas")
    .delete()
    .eq("pessoa_id", id)
    .eq("disciplina_id", disciplinaId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
