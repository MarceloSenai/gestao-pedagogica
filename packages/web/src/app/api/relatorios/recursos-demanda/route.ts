import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

function parseRequisitos(requisitos: Json): { recurso_id: string; quantidade: number }[] {
  if (!Array.isArray(requisitos)) return [];
  const result: { recurso_id: string; quantidade: number }[] = [];
  for (const r of requisitos) {
    if (
      typeof r === "object" &&
      r !== null &&
      "recurso_id" in r &&
      typeof (r as Record<string, unknown>).recurso_id === "string"
    ) {
      const obj = r as Record<string, unknown>;
      result.push({
        recurso_id: obj.recurso_id as string,
        quantidade: typeof obj.quantidade === "number" ? obj.quantidade : 0,
      });
    }
  }
  return result;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const [recRes, discRes] = await Promise.all([
    supabase.from("recursos").select("id, nome, quantidade, status, created_at, updated_at").order("nome"),
    supabase.from("disciplinas").select("id, requisitos_recursos"),
  ]);

  if (recRes.error) {
    return NextResponse.json({ error: recRes.error.message }, { status: 500 });
  }
  if (discRes.error) {
    return NextResponse.json({ error: discRes.error.message }, { status: 500 });
  }

  const demandaMap = new Map<string, number>();
  for (const disc of discRes.data) {
    const requisitos = parseRequisitos(disc.requisitos_recursos);
    for (const req of requisitos) {
      demandaMap.set(req.recurso_id, (demandaMap.get(req.recurso_id) ?? 0) + 1);
    }
  }

  const result = recRes.data.map((recurso) => ({
    ...recurso,
    demanda_count: demandaMap.get(recurso.id) ?? 0,
  }));

  return NextResponse.json(result);
}
