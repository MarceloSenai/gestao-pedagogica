import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface CreateNotificationOpts {
  tipo: string;
  titulo: string;
  mensagem: string;
  destinatario_id?: string;
  referencia_tipo?: string;
  referencia_id?: string;
}

export async function createNotification(
  supabase: SupabaseClient<Database>,
  opts: CreateNotificationOpts
) {
  return supabase.from("notificacoes").insert({
    tipo: opts.tipo,
    titulo: opts.titulo,
    mensagem: opts.mensagem,
    destinatario_id: opts.destinatario_id ?? null,
    referencia_tipo: opts.referencia_tipo ?? null,
    referencia_id: opts.referencia_id ?? null,
  });
}
