import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const predioId = request.nextUrl.searchParams.get("predio_id");

  let query = supabase.from("ambientes").select("*, predios(nome)").order("nome");

  if (predioId) {
    query = query.eq("predio_id", predioId);
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
  if (!body.predio_id) {
    return NextResponse.json({ error: "predio_id is required" }, { status: 400 });
  }
  if (!body.tipo) {
    return NextResponse.json({ error: "tipo is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ambientes")
    .insert({
      nome: body.nome,
      predio_id: body.predio_id,
      tipo: body.tipo,
      capacidade: body.capacidade ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
