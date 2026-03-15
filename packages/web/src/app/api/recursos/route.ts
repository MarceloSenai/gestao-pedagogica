import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("recursos")
    .select("*")
    .order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ error: "nome is required" }, { status: 400 });
  }
  if (body.quantidade === undefined || body.quantidade === null) {
    return NextResponse.json({ error: "quantidade is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recursos")
    .insert({ nome: body.nome, quantidade: body.quantidade })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
