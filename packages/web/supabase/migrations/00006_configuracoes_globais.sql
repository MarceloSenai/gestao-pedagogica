CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL DEFAULT '{}',
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral' CHECK (categoria IN ('geral', 'algoritmo', 'calendario', 'limites')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_configuracoes_updated_at
  BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select configuracoes" ON configuracoes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert configuracoes" ON configuracoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update configuracoes" ON configuracoes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Auth select configuracoes" ON configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert configuracoes" ON configuracoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update configuracoes" ON configuracoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed default configurations
INSERT INTO configuracoes (chave, valor, descricao, categoria) VALUES
  ('peso_capacidade', '{"valor": 0.4}', 'Peso da capacidade no score de alocação (0-1)', 'algoritmo'),
  ('peso_recursos', '{"valor": 0.5}', 'Peso do match de recursos no score (0-1)', 'algoritmo'),
  ('peso_especializacao', '{"valor": 0.1}', 'Bonus/penalidade de especialização (0-1)', 'algoritmo'),
  ('capacidade_minima_pct', '{"valor": 50}', 'Percentual mínimo de ocupação desejável', 'algoritmo'),
  ('capacidade_maxima_pct', '{"valor": 95}', 'Percentual máximo de ocupação permitido', 'limites'),
  ('semestre_atual', '{"valor": "2026.1"}', 'Semestre acadêmico atual', 'calendario'),
  ('ano_letivo', '{"valor": 2026}', 'Ano letivo atual', 'calendario'),
  ('turnos_disponiveis', '{"valor": ["manha", "tarde", "noite"]}', 'Turnos disponíveis para alocação', 'calendario'),
  ('max_turmas_por_docente', '{"valor": 4}', 'Máximo de turmas por docente por semestre', 'limites'),
  ('nome_instituicao', '{"valor": "Instituição de Ensino"}', 'Nome da instituição', 'geral')
ON CONFLICT (chave) DO NOTHING;
