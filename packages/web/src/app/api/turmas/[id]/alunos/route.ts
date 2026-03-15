import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("matriculas")
    .select("*, pessoas(nome, perfil)")
    .eq("turma_id", id);

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

  if (!body.aluno_id) {
    return NextResponse.json({ error: "aluno_id is required" }, { status: 400 });
  }

  // Check pessoa exists and has perfil='aluno'
  const { data: aluno, error: alunoError } = await supabase
    .from("pessoas")
    .select("perfil")
    .eq("id", body.aluno_id)
    .single();

  if (alunoError || !aluno) {
    return NextResponse.json({ error: "Aluno not found" }, { status: 404 });
  }

  if (aluno.perfil !== "aluno") {
    return NextResponse.json(
      { error: "Pessoa must have perfil 'aluno'" },
      { status: 400 }
    );
  }

  // Check turma vagas
  const { data: turma, error: turmaError } = await supabase
    .from("turmas")
    .select("vagas")
    .eq("id", id)
    .single();

  if (turmaError || !turma) {
    return NextResponse.json({ error: "Turma not found" }, { status: 404 });
  }

  const { count, error: countError } = await supabase
    .from("matriculas")
    .select("*", { count: "exact", head: true })
    .eq("turma_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= turma.vagas) {
    return NextResponse.json(
      { error: "Turma sem vagas disponíveis" },
      { status: 400 }
    );
  }

  // Insert matricula
  const { data, error } = await supabase
    .from("matriculas")
    .insert({ turma_id: id, aluno_id: body.aluno_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Aluno já matriculado nesta turma" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const alunoId = request.nextUrl.searchParams.get("aluno_id");

  if (!alunoId) {
    return NextResponse.json(
      { error: "aluno_id query param is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("matriculas")
    .delete()
    .eq("turma_id", id)
    .eq("aluno_id", alunoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
