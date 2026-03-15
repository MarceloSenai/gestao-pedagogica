import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ambiente_recursos")
    .select("*, recursos(*)")
    .eq("ambiente_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.recurso_id) {
    return NextResponse.json({ error: "recurso_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ambiente_recursos")
    .insert({
      ambiente_id: id,
      recurso_id: body.recurso_id,
      quantidade: body.quantidade ?? 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const recursoId = request.nextUrl.searchParams.get("recurso_id");

  if (!recursoId) {
    return NextResponse.json({ error: "recurso_id query param is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ambiente_recursos")
    .delete()
    .eq("ambiente_id", id)
    .eq("recurso_id", recursoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
