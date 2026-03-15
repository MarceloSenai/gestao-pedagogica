import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const predioId = request.nextUrl.searchParams.get("predio_id");

  let query = supabase
    .from("ambientes")
    .select("*, predios(nome)")
    .order("nome");

  if (predioId) {
    query = query.eq("predio_id", predioId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
