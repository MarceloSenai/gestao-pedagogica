import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("turmas")
    .select("*, disciplinas(nome, cursos(nome)), pessoas(nome)")
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

  if (body.docente_id) {
    const { data: docente, error: docenteError } = await supabase
      .from("pessoas")
      .select("perfil")
      .eq("id", body.docente_id)
      .single();

    if (docenteError || !docente) {
      return NextResponse.json({ error: "Docente not found" }, { status: 404 });
    }

    if (docente.perfil !== "docente") {
      return NextResponse.json(
        { error: "Pessoa must have perfil 'docente'" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("turmas")
    .update(body)
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

  const { error } = await supabase.from("turmas").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
