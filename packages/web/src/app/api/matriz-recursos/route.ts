import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch disciplinas with curso info
    const { data: disciplinas, error: discError } = await supabase
      .from("disciplinas")
      .select("id, nome, cursos(nome)")
      .order("nome");

    if (discError) return NextResponse.json({ error: discError.message }, { status: 500 });

    // Fetch all junction rows
    const { data: junctionRows, error: juncError } = await supabase
      .from("disciplina_recursos")
      .select("disciplina_id, recurso_id, quantidade");

    if (juncError) return NextResponse.json({ error: juncError.message }, { status: 500 });

    // Group junction rows by disciplina_id
    const recursosByDisciplina = new Map<string, Array<{ recurso_id: string; quantidade: number }>>();
    for (const row of junctionRows ?? []) {
      const list = recursosByDisciplina.get(row.disciplina_id) ?? [];
      list.push({ recurso_id: row.recurso_id, quantidade: row.quantidade });
      recursosByDisciplina.set(row.disciplina_id, list);
    }

    // Build response matching the expected shape
    const result = (disciplinas ?? []).map((d: Record<string, unknown>) => ({
      id: d.id,
      nome: d.nome,
      cursos: d.cursos,
      requisitos_recursos: recursosByDisciplina.get(d.id as string) ?? [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
