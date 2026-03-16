-- Migration 00009: Grade horária granular (dias × horários × ambientes)

-- 1. Slots de horário configuráveis da instituição
CREATE TABLE IF NOT EXISTS slots_horario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  ordem SMALLINT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  label TEXT NOT NULL,
  CONSTRAINT slot_valido CHECK (hora_fim > hora_inicio),
  UNIQUE(turno, ordem)
);

-- RLS
ALTER TABLE slots_horario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon select slots_horario" ON slots_horario FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert slots_horario" ON slots_horario FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update slots_horario" ON slots_horario FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete slots_horario" ON slots_horario FOR DELETE TO anon USING (true);
CREATE POLICY "auth select slots_horario" ON slots_horario FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert slots_horario" ON slots_horario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update slots_horario" ON slots_horario FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete slots_horario" ON slots_horario FOR DELETE TO authenticated USING (true);

-- Seed: slots padrão
INSERT INTO slots_horario (turno, ordem, hora_inicio, hora_fim, label) VALUES
  ('manha', 1, '08:00', '09:40', '1º Horário (08:00–09:40)'),
  ('manha', 2, '09:50', '11:30', '2º Horário (09:50–11:30)'),
  ('tarde', 1, '13:30', '15:10', '3º Horário (13:30–15:10)'),
  ('tarde', 2, '15:20', '17:00', '4º Horário (15:20–17:00)'),
  ('noite', 1, '19:00', '20:40', '5º Horário (19:00–20:40)'),
  ('noite', 2, '20:50', '22:30', '6º Horário (20:50–22:30)')
ON CONFLICT DO NOTHING;

-- 2. Horários de aula (cada slot alocado)
CREATE TABLE IF NOT EXISTS horarios_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alocacao_id UUID NOT NULL REFERENCES alocacoes(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 6),
  slot_id UUID NOT NULL REFERENCES slots_horario(id) ON DELETE CASCADE,
  ambiente_id UUID NOT NULL REFERENCES ambientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_horarios_alocacao ON horarios_aula(alocacao_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_slot ON horarios_aula(dia_semana, slot_id);
CREATE INDEX IF NOT EXISTS idx_horarios_ambiente ON horarios_aula(ambiente_id);

-- RLS
ALTER TABLE horarios_aula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon select horarios_aula" ON horarios_aula FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert horarios_aula" ON horarios_aula FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update horarios_aula" ON horarios_aula FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete horarios_aula" ON horarios_aula FOR DELETE TO anon USING (true);
CREATE POLICY "auth select horarios_aula" ON horarios_aula FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert horarios_aula" ON horarios_aula FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update horarios_aula" ON horarios_aula FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete horarios_aula" ON horarios_aula FOR DELETE TO authenticated USING (true);

-- 3. Adicionar aulas_semana à disciplinas
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS aulas_semana SMALLINT NOT NULL DEFAULT 2;
