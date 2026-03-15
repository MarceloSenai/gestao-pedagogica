import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const categoria = request.nextUrl.searchParams.get("categoria");

  let query = supabase
    .from("configuracoes")
    .select("*")
    .order("categoria")
    .order("chave");

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.chave) {
    return NextResponse.json({ error: "chave is required" }, { status: 400 });
  }
  if (body.valor === undefined) {
    return NextResponse.json({ error: "valor is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("configuracoes")
    .insert({
      chave: body.chave,
      valor: body.valor,
      descricao: body.descricao ?? null,
      categoria: body.categoria ?? "geral",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
