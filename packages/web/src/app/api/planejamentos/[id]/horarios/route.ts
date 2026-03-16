import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch all horarios_aula for this planejamento via alocacoes join
  const { data, error } = await supabase
    .from("horarios_aula")
    .select(`
      id,
      dia_semana,
      slot_id,
      ambiente_id,
      alocacao_id,
      alocacoes!inner(
        id,
        turma_id,
        planejamento_id,
        status,
        turmas(
          id,
          turno,
          vagas,
          docente_id,
          disciplinas(nome)
        )
      ),
      slots_horario(id, turno, ordem, hora_inicio, hora_fim, label),
      ambientes(id, nome, tipo, capacidade)
    `)
    .eq("alocacoes.planejamento_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
