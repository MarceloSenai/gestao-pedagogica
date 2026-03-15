-- turmas
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  docente_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,
  semestre TEXT NOT NULL,
  ano INTEGER NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  vagas INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turmas_disciplina ON turmas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_turmas_docente ON turmas(docente_id);

CREATE TRIGGER set_turmas_updated_at
  BEFORE UPDATE ON turmas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- matriculas
CREATE TABLE IF NOT EXISTS matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(turma_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_matriculas_turma ON matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno ON matriculas(aluno_id);

-- RLS
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select turmas" ON turmas FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert turmas" ON turmas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update turmas" ON turmas FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete turmas" ON turmas FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated users can read turmas" ON turmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert turmas" ON turmas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update turmas" ON turmas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete turmas" ON turmas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow anon select matriculas" ON matriculas FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert matriculas" ON matriculas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update matriculas" ON matriculas FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete matriculas" ON matriculas FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated users can read matriculas" ON matriculas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert matriculas" ON matriculas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update matriculas" ON matriculas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete matriculas" ON matriculas FOR DELETE TO authenticated USING (true);
