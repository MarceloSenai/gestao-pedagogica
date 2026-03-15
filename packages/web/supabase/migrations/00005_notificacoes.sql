CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('info', 'alerta', 'conflito', 'sistema')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  destinatario_id UUID REFERENCES pessoas(id) ON DELETE CASCADE,
  referencia_tipo TEXT, -- 'planejamento', 'chamado', 'turma', etc
  referencia_id UUID,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario ON notificacoes(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- RLS (anon + authenticated)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select notificacoes" ON notificacoes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert notificacoes" ON notificacoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update notificacoes" ON notificacoes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete notificacoes" ON notificacoes FOR DELETE TO anon USING (true);
CREATE POLICY "Auth select notificacoes" ON notificacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert notificacoes" ON notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update notificacoes" ON notificacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete notificacoes" ON notificacoes FOR DELETE TO authenticated USING (true);
