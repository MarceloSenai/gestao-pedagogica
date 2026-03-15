-- Add status to ambientes
ALTER TABLE ambientes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo'
  CHECK (status IN ('ativo', 'em_manutencao', 'desativado'));

-- Add status to recursos
ALTER TABLE recursos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'disponivel'
  CHECK (status IN ('disponivel', 'em_uso', 'em_manutencao', 'indisponivel'));

-- Chamados table
CREATE TABLE IF NOT EXISTS chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ambiente', 'recurso')),
  referencia_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido')),
  comentario_resolucao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_tipo_ref ON chamados(tipo, referencia_id);

CREATE TRIGGER set_chamados_updated_at
  BEFORE UPDATE ON chamados FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select chamados" ON chamados FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert chamados" ON chamados FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update chamados" ON chamados FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete chamados" ON chamados FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated select chamados" ON chamados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert chamados" ON chamados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update chamados" ON chamados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete chamados" ON chamados FOR DELETE TO authenticated USING (true);
