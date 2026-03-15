CREATE TABLE IF NOT EXISTS planejamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semestre TEXT NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_planejamentos_updated_at
  BEFORE UPDATE ON planejamentos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS alocacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  ambiente_id UUID REFERENCES ambientes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'nao_alocada' CHECK (status IN ('alocada', 'nao_alocada', 'conflito')),
  motivo TEXT,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alocacoes_planejamento ON alocacoes(planejamento_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_turma ON alocacoes(turma_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_ambiente ON alocacoes(ambiente_id);

-- RLS
ALTER TABLE planejamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alocacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select planejamentos" ON planejamentos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert planejamentos" ON planejamentos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update planejamentos" ON planejamentos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete planejamentos" ON planejamentos FOR DELETE TO anon USING (true);
CREATE POLICY "Auth select planejamentos" ON planejamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert planejamentos" ON planejamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update planejamentos" ON planejamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete planejamentos" ON planejamentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow anon select alocacoes" ON alocacoes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert alocacoes" ON alocacoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update alocacoes" ON alocacoes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete alocacoes" ON alocacoes FOR DELETE TO anon USING (true);
CREATE POLICY "Auth select alocacoes" ON alocacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert alocacoes" ON alocacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update alocacoes" ON alocacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete alocacoes" ON alocacoes FOR DELETE TO authenticated USING (true);
