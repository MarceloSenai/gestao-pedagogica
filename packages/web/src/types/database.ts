export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      predios: {
        Row: {
          id: string;
          nome: string;
          endereco: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          endereco?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          endereco?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ambientes_predio_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "ambientes";
            referencedColumns: ["predio_id"];
          },
        ];
      };
      ambientes: {
        Row: {
          id: string;
          predio_id: string;
          nome: string;
          tipo: string;
          capacidade: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          predio_id: string;
          nome: string;
          tipo: string;
          capacidade?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          predio_id?: string;
          nome?: string;
          tipo?: string;
          capacidade?: number | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ambientes_predio_id_fkey";
            columns: ["predio_id"];
            isOneToOne: false;
            referencedRelation: "predios";
            referencedColumns: ["id"];
          },
        ];
      };
      recursos: {
        Row: {
          id: string;
          nome: string;
          quantidade: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          quantidade: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          quantidade?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cursos: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      disciplinas: {
        Row: {
          id: string;
          curso_id: string;
          nome: string;
          carga_horaria: number;
          requisitos_recursos: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          curso_id: string;
          nome: string;
          carga_horaria: number;
          requisitos_recursos?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          curso_id?: string;
          nome?: string;
          carga_horaria?: number;
          requisitos_recursos?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "disciplinas_curso_id_fkey";
            columns: ["curso_id"];
            isOneToOne: false;
            referencedRelation: "cursos";
            referencedColumns: ["id"];
          },
        ];
      };
      pessoas: {
        Row: {
          id: string;
          nome: string;
          perfil: string;
          competencias: Json;
          disponibilidade: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          perfil: string;
          competencias?: Json;
          disponibilidade?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          perfil?: string;
          competencias?: Json;
          disponibilidade?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      ambiente_recursos: {
        Row: {
          ambiente_id: string;
          recurso_id: string;
          quantidade: number;
        };
        Insert: {
          ambiente_id: string;
          recurso_id: string;
          quantidade?: number;
        };
        Update: {
          ambiente_id?: string;
          recurso_id?: string;
          quantidade?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ambiente_recursos_ambiente_id_fkey";
            columns: ["ambiente_id"];
            isOneToOne: false;
            referencedRelation: "ambientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ambiente_recursos_recurso_id_fkey";
            columns: ["recurso_id"];
            isOneToOne: false;
            referencedRelation: "recursos";
            referencedColumns: ["id"];
          },
        ];
      };
      pessoa_disciplinas: {
        Row: {
          pessoa_id: string;
          disciplina_id: string;
          papel: string | null;
        };
        Insert: {
          pessoa_id: string;
          disciplina_id: string;
          papel?: string | null;
        };
        Update: {
          pessoa_id?: string;
          disciplina_id?: string;
          papel?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pessoa_disciplinas_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pessoa_disciplinas_disciplina_id_fkey";
            columns: ["disciplina_id"];
            isOneToOne: false;
            referencedRelation: "disciplinas";
            referencedColumns: ["id"];
          },
        ];
      };
      turmas: {
        Row: {
          id: string;
          disciplina_id: string;
          docente_id: string | null;
          semestre: string;
          ano: number;
          turno: string;
          vagas: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          disciplina_id: string;
          docente_id?: string | null;
          semestre: string;
          ano: number;
          turno: string;
          vagas?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          disciplina_id?: string;
          docente_id?: string | null;
          semestre?: string;
          ano?: number;
          turno?: string;
          vagas?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "turmas_disciplina_id_fkey";
            columns: ["disciplina_id"];
            isOneToOne: false;
            referencedRelation: "disciplinas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turmas_docente_id_fkey";
            columns: ["docente_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      matriculas: {
        Row: {
          id: string;
          turma_id: string;
          aluno_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          turma_id: string;
          aluno_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          turma_id?: string;
          aluno_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matriculas_turma_id_fkey";
            columns: ["turma_id"];
            isOneToOne: false;
            referencedRelation: "turmas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matriculas_aluno_id_fkey";
            columns: ["aluno_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      planejamentos: {
        Row: {
          id: string;
          semestre: string;
          ano: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          semestre: string;
          ano: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          semestre?: string;
          ano?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alocacoes: {
        Row: {
          id: string;
          planejamento_id: string;
          turma_id: string;
          ambiente_id: string | null;
          status: string;
          motivo: string | null;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          planejamento_id: string;
          turma_id: string;
          ambiente_id?: string | null;
          status?: string;
          motivo?: string | null;
          score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          planejamento_id?: string;
          turma_id?: string;
          ambiente_id?: string | null;
          status?: string;
          motivo?: string | null;
          score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "alocacoes_planejamento_id_fkey";
            columns: ["planejamento_id"];
            isOneToOne: false;
            referencedRelation: "planejamentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alocacoes_turma_id_fkey";
            columns: ["turma_id"];
            isOneToOne: false;
            referencedRelation: "turmas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alocacoes_ambiente_id_fkey";
            columns: ["ambiente_id"];
            isOneToOne: false;
            referencedRelation: "ambientes";
            referencedColumns: ["id"];
          },
        ];
      };
      chamados: {
        Row: {
          id: string;
          tipo: string;
          referencia_id: string;
          titulo: string;
          descricao: string | null;
          prioridade: string;
          status: string;
          comentario_resolucao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          referencia_id: string;
          titulo: string;
          descricao?: string | null;
          prioridade?: string;
          status?: string;
          comentario_resolucao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          referencia_id?: string;
          titulo?: string;
          descricao?: string | null;
          prioridade?: string;
          status?: string;
          comentario_resolucao?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Predio = Database["public"]["Tables"]["predios"]["Row"];
export type PredioInsert = Database["public"]["Tables"]["predios"]["Insert"];
export type PredioUpdate = Database["public"]["Tables"]["predios"]["Update"];

export type Ambiente = Database["public"]["Tables"]["ambientes"]["Row"];
export type AmbienteInsert = Database["public"]["Tables"]["ambientes"]["Insert"];
export type AmbienteUpdate = Database["public"]["Tables"]["ambientes"]["Update"];

export type Recurso = Database["public"]["Tables"]["recursos"]["Row"];
export type RecursoInsert = Database["public"]["Tables"]["recursos"]["Insert"];
export type RecursoUpdate = Database["public"]["Tables"]["recursos"]["Update"];

export type Curso = Database["public"]["Tables"]["cursos"]["Row"];
export type CursoInsert = Database["public"]["Tables"]["cursos"]["Insert"];
export type CursoUpdate = Database["public"]["Tables"]["cursos"]["Update"];

export type Disciplina = Database["public"]["Tables"]["disciplinas"]["Row"];
export type DisciplinaInsert = Database["public"]["Tables"]["disciplinas"]["Insert"];
export type DisciplinaUpdate = Database["public"]["Tables"]["disciplinas"]["Update"];

export type Pessoa = Database["public"]["Tables"]["pessoas"]["Row"];
export type PessoaInsert = Database["public"]["Tables"]["pessoas"]["Insert"];
export type PessoaUpdate = Database["public"]["Tables"]["pessoas"]["Update"];

export type AmbienteRecurso = Database["public"]["Tables"]["ambiente_recursos"]["Row"];
export type PessoaDisciplina = Database["public"]["Tables"]["pessoa_disciplinas"]["Row"];

export type AmbienteTipo = "sala" | "laboratorio" | "auditorio" | "oficina";
export type PessoaPerfil =
  | "gestor"
  | "coordenador"
  | "secretaria"
  | "docente"
  | "aluno"
  | "apoio_ti"
  | "auditor";

export type Turma = Database["public"]["Tables"]["turmas"]["Row"];
export type TurmaInsert = Database["public"]["Tables"]["turmas"]["Insert"];
export type TurmaUpdate = Database["public"]["Tables"]["turmas"]["Update"];

export type Matricula = Database["public"]["Tables"]["matriculas"]["Row"];
export type MatriculaInsert = Database["public"]["Tables"]["matriculas"]["Insert"];

export type TurmasTurno = "manha" | "tarde" | "noite";

export type Chamado = Database["public"]["Tables"]["chamados"]["Row"];
export type ChamadoInsert = Database["public"]["Tables"]["chamados"]["Insert"];
export type ChamadoUpdate = Database["public"]["Tables"]["chamados"]["Update"];

export type Planejamento = Database["public"]["Tables"]["planejamentos"]["Row"];
export type PlanejamentoInsert = Database["public"]["Tables"]["planejamentos"]["Insert"];
export type PlanejamentoUpdate = Database["public"]["Tables"]["planejamentos"]["Update"];

export type Alocacao = Database["public"]["Tables"]["alocacoes"]["Row"];
export type AlocacaoInsert = Database["public"]["Tables"]["alocacoes"]["Insert"];

export type PlanejamentoStatus = "rascunho" | "publicado";
export type AlocacaoStatus = "alocada" | "nao_alocada" | "conflito";

export type AmbienteStatus = "ativo" | "em_manutencao" | "desativado";
export type RecursoStatus = "disponivel" | "em_uso" | "em_manutencao" | "indisponivel";
export type ChamadoTipo = "ambiente" | "recurso";
export type ChamadoPrioridade = "baixa" | "media" | "alta" | "urgente";
export type ChamadoStatus = "aberto" | "em_andamento" | "resolvido";
