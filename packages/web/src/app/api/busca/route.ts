import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json([]);

  const supabase = await createServerSupabaseClient();
  const term = `%${q}%`;

  const [predios, ambientes, cursos, disciplinas, pessoas] = await Promise.all([
    supabase.from("predios").select("id, nome").ilike("nome", term).limit(5),
    supabase.from("ambientes").select("id, nome, tipo").ilike("nome", term).limit(5),
    supabase.from("cursos").select("id, nome").ilike("nome", term).limit(5),
    supabase.from("disciplinas").select("id, nome").ilike("nome", term).limit(5),
    supabase.from("pessoas").select("id, nome, perfil").ilike("nome", term).limit(5),
  ]);

  const results = [
    ...(predios.data || []).map((r: { id: string; nome: string }) => ({ tipo: "Predio", id: r.id, nome: r.nome, href: "/predios" })),
    ...(ambientes.data || []).map((r: { id: string; nome: string; tipo: string }) => ({ tipo: "Ambiente", id: r.id, nome: `${r.nome} (${r.tipo})`, href: "/ambientes" })),
    ...(cursos.data || []).map((r: { id: string; nome: string }) => ({ tipo: "Curso", id: r.id, nome: r.nome, href: "/cursos" })),
    ...(disciplinas.data || []).map((r: { id: string; nome: string }) => ({ tipo: "Disciplina", id: r.id, nome: r.nome, href: "/disciplinas" })),
    ...(pessoas.data || []).map((r: { id: string; nome: string; perfil: string }) => ({ tipo: r.perfil, id: r.id, nome: r.nome, href: "/pessoas" })),
  ];

  return NextResponse.json(results);
}
