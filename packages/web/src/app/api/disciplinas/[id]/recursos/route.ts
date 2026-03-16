import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("disciplina_recursos")
    .select("recurso_id, quantidade, recursos(nome)")
    .eq("disciplina_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((row: Record<string, unknown>) => ({
    recurso_id: row.recurso_id as string,
    quantidade: row.quantidade as number,
    recurso_nome: (row.recursos as { nome: string } | null)?.nome ?? null,
  }));

  return NextResponse.json(items);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const body: Array<{ recurso_id: string; quantidade?: number }> = await request.json();

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be an array of { recurso_id, quantidade }" },
      { status: 400 }
    );
  }

  // Delete existing rows for this disciplina
  const { error: delError } = await supabase
    .from("disciplina_recursos")
    .delete()
    .eq("disciplina_id", id);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  // Insert new rows (if any)
  if (body.length > 0) {
    const rows = body.map((item) => ({
      disciplina_id: id,
      recurso_id: item.recurso_id,
      quantidade: item.quantidade ?? 1,
    }));

    const { error: insError } = await supabase
      .from("disciplina_recursos")
      .insert(rows);

    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
