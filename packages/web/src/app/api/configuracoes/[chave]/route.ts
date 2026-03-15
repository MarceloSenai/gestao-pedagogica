import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chave: string }> }
) {
  const { chave } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("chave", chave)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chave: string }> }
) {
  const { chave } = await params;
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (body.valor === undefined) {
    return NextResponse.json({ error: "valor is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("configuracoes")
    .update({ valor: body.valor })
    .eq("chave", chave)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
