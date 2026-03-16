-- Create proper junction table
CREATE TABLE IF NOT EXISTS disciplina_recursos (
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (disciplina_id, recurso_id)
);

CREATE INDEX IF NOT EXISTS idx_disciplina_recursos_recurso ON disciplina_recursos(recurso_id);

-- RLS
ALTER TABLE disciplina_recursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select disciplina_recursos" ON disciplina_recursos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert disciplina_recursos" ON disciplina_recursos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update disciplina_recursos" ON disciplina_recursos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete disciplina_recursos" ON disciplina_recursos FOR DELETE TO anon USING (true);
CREATE POLICY "Auth select disciplina_recursos" ON disciplina_recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert disciplina_recursos" ON disciplina_recursos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update disciplina_recursos" ON disciplina_recursos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete disciplina_recursos" ON disciplina_recursos FOR DELETE TO authenticated USING (true);

-- Migrate existing JSONB data to junction table
INSERT INTO disciplina_recursos (disciplina_id, recurso_id, quantidade)
SELECT
  d.id as disciplina_id,
  (r->>'recurso_id')::uuid as recurso_id,
  COALESCE((r->>'quantidade')::integer, 1) as quantidade
FROM disciplinas d,
  jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(d.requisitos_recursos) = 'array' AND jsonb_array_length(d.requisitos_recursos) > 0
      THEN d.requisitos_recursos
      ELSE '[]'::jsonb
    END
  ) AS r
WHERE r->>'recurso_id' IS NOT NULL
ON CONFLICT (disciplina_id, recurso_id) DO NOTHING;
