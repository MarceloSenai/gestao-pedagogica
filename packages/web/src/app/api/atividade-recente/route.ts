import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Get recently modified items across tables
  const [predios, ambientes, turmas, chamados, planejamentos] =
    await Promise.all([
      supabase
        .from("predios")
        .select("id, nome, updated_at")
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("ambientes")
        .select("id, nome, updated_at")
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("turmas")
        .select("id, semestre, turno, updated_at, disciplinas(nome)")
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("chamados")
        .select("id, titulo, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("planejamentos")
        .select("id, semestre, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

  const activities = [
    ...(predios.data || []).map((r) => ({
      tipo: "Predio",
      nome: r.nome,
      data: r.updated_at,
      href: "/predios",
    })),
    ...(ambientes.data || []).map((r) => ({
      tipo: "Ambiente",
      nome: r.nome,
      data: r.updated_at,
      href: "/ambientes",
    })),
    ...(turmas.data || []).map((r) => ({
      tipo: "Turma",
      nome:
        (r as Record<string, unknown>).disciplinas &&
        typeof (r as Record<string, unknown>).disciplinas === "object" &&
        (r as Record<string, unknown>).disciplinas !== null
          ? ((r as Record<string, unknown>).disciplinas as { nome: string }).nome
          : r.semestre,
      data: r.updated_at,
      href: "/turmas",
    })),
    ...(chamados.data || []).map((r) => ({
      tipo: "Chamado",
      nome: r.titulo,
      data: r.updated_at,
      href: "/chamados",
    })),
    ...(planejamentos.data || []).map((r) => ({
      tipo: "Planejamento",
      nome: `${r.semestre} (${r.status})`,
      data: r.updated_at,
      href: "/planejamentos",
    })),
  ]
    .sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    )
    .slice(0, 10);

  return NextResponse.json(activities);
}
