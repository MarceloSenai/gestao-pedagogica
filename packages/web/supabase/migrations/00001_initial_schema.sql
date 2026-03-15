-- ==========================================================
-- Migration: Initial Schema for Gestão Pedagógica
-- Story: 1.0 - Fundação do Módulo Planejamento Inteligente
-- Source: Idea Pack IDEA-8922D1E7 + Schema Adjustments
-- ==========================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Table: predios (Entity: Prédio / DM-1)
-- ============================================
CREATE TABLE IF NOT EXISTS predios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_predios_updated_at
  BEFORE UPDATE ON predios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- Table: ambientes (Entity: Ambiente / DM-3)
-- Added: capacidade INTEGER (FR-36)
-- ============================================
CREATE TABLE IF NOT EXISTS ambientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predio_id UUID NOT NULL REFERENCES predios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sala', 'laboratorio', 'auditorio', 'oficina')),
  capacidade INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ambientes_predio ON ambientes(predio_id);

CREATE TRIGGER set_ambientes_updated_at
  BEFORE UPDATE ON ambientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- Table: recursos (Entity: Recurso / DM-4)
-- ============================================
CREATE TABLE IF NOT EXISTS recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_recursos_updated_at
  BEFORE UPDATE ON recursos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- Table: cursos (New - referenced by disciplinas)
-- ============================================
CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_cursos_updated_at
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- Table: disciplinas (Entity: Disciplina / DM-2)
-- Removed: direct recurso_id and pessoa_id FKs
-- Uses: JSONB requisitos_recursos + junction tables
-- ============================================
CREATE TABLE IF NOT EXISTS disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  carga_horaria NUMERIC NOT NULL,
  requisitos_recursos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_curso ON disciplinas(curso_id);

CREATE TRIGGER set_disciplinas_updated_at
  BEFORE UPDATE ON disciplinas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- Table: pessoas (Entity: Pessoa / DM-5)
-- ============================================
CREATE TABLE IF NOT EXISTS pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('gestor', 'coordenador', 'secretaria', 'docente', 'aluno', 'apoio_ti', 'auditor')),
  competencias JSONB DEFAULT '[]',
  disponibilidade JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pessoas_perfil ON pessoas(perfil);

CREATE TRIGGER set_pessoas_updated_at
  BEFORE UPDATE ON pessoas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- Junction: ambiente_recursos (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS ambiente_recursos (
  ambiente_id UUID NOT NULL REFERENCES ambientes(id) ON DELETE CASCADE,
  recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ambiente_id, recurso_id)
);

CREATE INDEX IF NOT EXISTS idx_ambiente_recursos_recurso ON ambiente_recursos(recurso_id);

-- ============================================
-- Junction: pessoa_disciplinas (N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS pessoa_disciplinas (
  pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  papel TEXT DEFAULT 'titular',
  PRIMARY KEY (pessoa_id, disciplina_id)
);

CREATE INDEX IF NOT EXISTS idx_pessoa_disciplinas_disciplina ON pessoa_disciplinas(disciplina_id);

-- ============================================
-- RLS Policies (Basic - authenticated CRUD)
-- ============================================
ALTER TABLE predios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambiente_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoa_disciplinas ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (basic RLS)
CREATE POLICY "Authenticated users can read predios" ON predios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert predios" ON predios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update predios" ON predios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete predios" ON predios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read ambientes" ON ambientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ambientes" ON ambientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ambientes" ON ambientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete ambientes" ON ambientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read recursos" ON recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert recursos" ON recursos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update recursos" ON recursos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete recursos" ON recursos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read cursos" ON cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cursos" ON cursos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cursos" ON cursos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete cursos" ON cursos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read disciplinas" ON disciplinas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert disciplinas" ON disciplinas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update disciplinas" ON disciplinas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete disciplinas" ON disciplinas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read pessoas" ON pessoas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pessoas" ON pessoas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pessoas" ON pessoas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete pessoas" ON pessoas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read ambiente_recursos" ON ambiente_recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ambiente_recursos" ON ambiente_recursos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ambiente_recursos" ON ambiente_recursos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete ambiente_recursos" ON ambiente_recursos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read pessoa_disciplinas" ON pessoa_disciplinas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pessoa_disciplinas" ON pessoa_disciplinas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pessoa_disciplinas" ON pessoa_disciplinas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete pessoa_disciplinas" ON pessoa_disciplinas FOR DELETE TO authenticated USING (true);
