import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const searchParams = request.nextUrl.searchParams;
  const disciplinaId = searchParams.get("disciplina_id");
  const cursoId = searchParams.get("curso_id");
  const semestre = searchParams.get("semestre");

  let query = supabase
    .from("turmas")
    .select("*, disciplinas(nome, cursos(nome)), pessoas(nome)");

  if (disciplinaId) {
    query = query.eq("disciplina_id", disciplinaId);
  }

  if (cursoId) {
    query = query.eq("disciplinas.curso_id", cursoId);
  }

  if (semestre) {
    query = query.eq("semestre", semestre);
  }

  const { data, error } = await query.order("semestre", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.disciplina_id || !body.semestre || body.ano == null || !body.turno) {
    return NextResponse.json(
      { error: "disciplina_id, semestre, ano, and turno are required" },
      { status: 400 }
    );
  }

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
    .insert({
      disciplina_id: body.disciplina_id,
      docente_id: body.docente_id ?? null,
      semestre: body.semestre,
      ano: body.ano,
      turno: body.turno,
      vagas: body.vagas ?? 40,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
