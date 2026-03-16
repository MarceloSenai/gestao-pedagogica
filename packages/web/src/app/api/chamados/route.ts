import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/create";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const status = request.nextUrl.searchParams.get("status");
  const prioridade = request.nextUrl.searchParams.get("prioridade");
  const tipo = request.nextUrl.searchParams.get("tipo");

  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 50));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("chamados")
    .select("*", { count: "exact" })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }
  if (prioridade) {
    query = query.eq("prioridade", prioridade);
  }
  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  // Order by prioridade desc (urgente > alta > media > baixa), then created_at desc
  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!pageParam) {
    return NextResponse.json(data);
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  if (!body.tipo) {
    return NextResponse.json({ error: "tipo is required" }, { status: 400 });
  }
  if (!body.referencia_id) {
    return NextResponse.json({ error: "referencia_id is required" }, { status: 400 });
  }
  if (!body.titulo) {
    return NextResponse.json({ error: "titulo is required" }, { status: 400 });
  }

  const VALID_TIPOS = ["ambiente", "recurso"];
  if (!VALID_TIPOS.includes(body.tipo)) {
    return NextResponse.json(
      { error: `tipo must be one of: ${VALID_TIPOS.join(", ")}` },
      { status: 400 }
    );
  }

  const VALID_PRIORIDADES = ["baixa", "media", "alta", "urgente"];
  if (body.prioridade && !VALID_PRIORIDADES.includes(body.prioridade)) {
    return NextResponse.json(
      { error: `prioridade must be one of: ${VALID_PRIORIDADES.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("chamados")
    .insert({
      tipo: body.tipo,
      referencia_id: body.referencia_id,
      titulo: body.titulo,
      descricao: body.descricao ?? null,
      prioridade: body.prioridade ?? "media",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification(supabase, {
    tipo: "alerta",
    titulo: "Novo chamado criado",
    mensagem: `Chamado "${body.titulo}" (prioridade: ${body.prioridade ?? "media"})`,
    referencia_tipo: "chamado",
    referencia_id: (data as { id: string }).id,
  });

  return NextResponse.json(data, { status: 201 });
}
