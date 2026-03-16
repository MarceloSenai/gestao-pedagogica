import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const perfil = request.nextUrl.searchParams.get("perfil");

  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("pessoas")
    .select("*", { count: "exact" })
    .range(from, to)
    .order("nome");

  if (perfil) {
    query = query.eq("perfil", perfil);
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
  if (!body.perfil) {
    return NextResponse.json({ error: "perfil is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pessoas")
    .insert({
      nome: body.nome,
      perfil: body.perfil,
      competencias: body.competencias ?? [],
      disponibilidade: body.disponibilidade ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
