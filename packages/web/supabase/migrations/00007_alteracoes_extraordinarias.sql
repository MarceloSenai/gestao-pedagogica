-- Story 11.0: Trava Pos-Publicacao + Ordem Extraordinaria (FR-40/41)
CREATE TABLE IF NOT EXISTS alteracoes_extraordinarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('adicionar', 'remover', 'modificar')),
  descricao TEXT NOT NULL,
  turma_id UUID REFERENCES turmas(id),
  ambiente_anterior_id UUID REFERENCES ambientes(id),
  ambiente_novo_id UUID REFERENCES ambientes(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  justificativa TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_alteracoes_updated_at
  BEFORE UPDATE ON alteracoes_extraordinarias FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_alteracoes_planejamento ON alteracoes_extraordinarias(planejamento_id);

-- RLS
ALTER TABLE alteracoes_extraordinarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select alteracoes" ON alteracoes_extraordinarias FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert alteracoes" ON alteracoes_extraordinarias FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update alteracoes" ON alteracoes_extraordinarias FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Auth select alteracoes" ON alteracoes_extraordinarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert alteracoes" ON alteracoes_extraordinarias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update alteracoes" ON alteracoes_extraordinarias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
