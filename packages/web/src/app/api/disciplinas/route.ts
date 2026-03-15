import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const cursoId = request.nextUrl.searchParams.get("curso_id");

  let query = supabase.from("disciplinas").select("*, cursos(nome)").order("nome");

  if (cursoId) {
    query = query.eq("curso_id", cursoId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ error: "nome is required" }, { status: 400 });
  }
  if (!body.curso_id) {
    return NextResponse.json({ error: "curso_id is required" }, { status: 400 });
  }
  if (body.carga_horaria === undefined || body.carga_horaria === null) {
    return NextResponse.json({ error: "carga_horaria is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("disciplinas")
    .insert({
      nome: body.nome,
      curso_id: body.curso_id,
      carga_horaria: body.carga_horaria,
      requisitos_recursos: body.requisitos_recursos ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
