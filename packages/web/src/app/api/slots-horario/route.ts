import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("slots_horario")
    .select("*")
    .order("turno")
    .order("ordem");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.turno || !body.hora_inicio || !body.hora_fim || !body.label) {
    return NextResponse.json({ error: "turno, hora_inicio, hora_fim and label are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("slots_horario")
    .insert({
      turno: body.turno,
      ordem: body.ordem ?? 1,
      hora_inicio: body.hora_inicio,
      hora_fim: body.hora_fim,
      label: body.label,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
