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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          predio_id: string;
          nome: string;
          tipo: string;
          capacidade?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          predio_id?: string;
          nome?: string;
          tipo?: string;
          capacidade?: number | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          quantidade: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          quantidade?: number;
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
