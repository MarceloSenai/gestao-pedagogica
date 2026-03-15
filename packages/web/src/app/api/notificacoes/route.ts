import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const lida = request.nextUrl.searchParams.get("lida");
  const tipo = request.nextUrl.searchParams.get("tipo");

  let query = supabase.from("notificacoes").select("*");

  if (lida !== null) {
    query = query.eq("lida", lida === "true");
  }
  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  query = query.order("created_at", { ascending: false }).limit(50);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.tipo) {
    return NextResponse.json({ error: "tipo is required" }, { status: 400 });
  }
  if (!body.titulo) {
    return NextResponse.json({ error: "titulo is required" }, { status: 400 });
  }
  if (!body.mensagem) {
    return NextResponse.json({ error: "mensagem is required" }, { status: 400 });
  }

  const VALID_TIPOS = ["info", "alerta", "conflito", "sistema"];
  if (!VALID_TIPOS.includes(body.tipo)) {
    return NextResponse.json(
      { error: `tipo must be one of: ${VALID_TIPOS.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("notificacoes")
    .insert({
      tipo: body.tipo,
      titulo: body.titulo,
      mensagem: body.mensagem,
      destinatario_id: body.destinatario_id ?? null,
      referencia_tipo: body.referencia_tipo ?? null,
      referencia_id: body.referencia_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
