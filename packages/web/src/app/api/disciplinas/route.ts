import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const cursoId = request.nextUrl.searchParams.get("curso_id");

  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("disciplinas")
    .select("*, cursos(nome)", { count: "exact" })
    .range(from, to)
    .order("nome");

  if (cursoId) {
    query = query.eq("curso_id", cursoId);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!pageParam) {
    return NextResponse.json(data);
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
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
      aulas_semana: body.aulas_semana ?? 2,
      requisitos_recursos: body.requisitos_recursos ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
