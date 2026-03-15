import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AlteracaoExtraordinaria } from "@/types/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; alteracaoId: string }> },
) {
  const { id, alteracaoId } = await params;
  const supabase = await createServerSupabaseClient();

  const body = await request.json();
  const { status } = body;

  if (!status || !["aprovada", "rejeitada"].includes(status)) {
    return NextResponse.json(
      { error: "Status deve ser: aprovada ou rejeitada" },
      { status: 400 },
    );
  }

  // Fetch the alteracao
  const { data: rawAlteracao, error: fetchError } = await supabase
    .from("alteracoes_extraordinarias")
    .select("*")
    .eq("id", alteracaoId)
    .eq("planejamento_id", id)
    .single();

  if (fetchError) {
    const httpStatus = fetchError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: fetchError.message }, { status: httpStatus });
  }

  const alteracao = rawAlteracao as unknown as AlteracaoExtraordinaria;

  if (alteracao.status !== "pendente") {
    return NextResponse.json(
      { error: "Apenas alteracoes pendentes podem ser aprovadas ou rejeitadas" },
      { status: 400 },
    );
  }

  // Update the alteracao status
  const { data, error: updateError } = await supabase
    .from("alteracoes_extraordinarias")
    .update({ status })
    .eq("id", alteracaoId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If approved and tipo=modificar, update the alocacao
  if (status === "aprovada" && alteracao.tipo === "modificar" && alteracao.turma_id && alteracao.ambiente_novo_id) {
    const { error: alocError } = await supabase
      .from("alocacoes")
      .update({
        ambiente_id: alteracao.ambiente_novo_id,
        status: "alocada",
        motivo: `Alteracao extraordinaria: ${alteracao.descricao}`,
      })
      .eq("planejamento_id", id)
      .eq("turma_id", alteracao.turma_id);

    if (alocError) {
      return NextResponse.json(
        { error: `Alteracao aprovada mas falha ao atualizar alocacao: ${alocError.message}` },
        { status: 500 },
      );
    }
  }

  // If approved and tipo=remover, remove the alocacao
  if (status === "aprovada" && alteracao.tipo === "remover" && alteracao.turma_id) {
    await supabase
      .from("alocacoes")
      .update({
        ambiente_id: null,
        status: "nao_alocada",
        motivo: `Removido por alteracao extraordinaria: ${alteracao.descricao}`,
      })
      .eq("planejamento_id", id)
      .eq("turma_id", alteracao.turma_id);
  }

  // If approved and tipo=adicionar, create/update alocacao
  if (status === "aprovada" && alteracao.tipo === "adicionar" && alteracao.turma_id && alteracao.ambiente_novo_id) {
    // Try to update existing, or insert new
    const { data: existingAloc } = await supabase
      .from("alocacoes")
      .select("id")
      .eq("planejamento_id", id)
      .eq("turma_id", alteracao.turma_id)
      .single();

    if (existingAloc) {
      await supabase
        .from("alocacoes")
        .update({
          ambiente_id: alteracao.ambiente_novo_id,
          status: "alocada",
          motivo: `Adicionado por alteracao extraordinaria: ${alteracao.descricao}`,
        })
        .eq("id", existingAloc.id);
    } else {
      await supabase.from("alocacoes").insert({
        planejamento_id: id,
        turma_id: alteracao.turma_id,
        ambiente_id: alteracao.ambiente_novo_id,
        status: "alocada",
        motivo: `Adicionado por alteracao extraordinaria: ${alteracao.descricao}`,
        score: 0,
      });
    }
  }

  return NextResponse.json(data);
}
