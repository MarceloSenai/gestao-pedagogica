"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gp-onboarding-done";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  color: string;
}

const STEPS: Step[] = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Infraestrutura",
    description: "Cadastre a estrutura fisica da sua instituicao.",
    details: [
      "Predios — unidades fisicas (campus, blocos)",
      "Ambientes — salas, laboratorios, auditorios, oficinas",
      "Recursos — projetores, computadores, equipamentos",
      "Chamados — solicitacoes de manutencao com prioridade",
    ],
    color: "#3b82f6",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
    title: "Academico",
    description: "Monte toda a grade curricular.",
    details: [
      "Cursos — programas de ensino (Engenharia, Medicina...)",
      "Disciplinas — materias com carga horaria e aulas/semana",
      "Requisitos de Recursos — quais equipamentos cada disciplina precisa",
      "Pessoas — docentes, alunos, coordenadores, gestores",
      "Turmas — vincule disciplina + docente + turno + semestre",
      "Matriculas — inscreva alunos nas turmas",
    ],
    color: "#22c55e",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Planejamento Inteligente",
    description: "O motor de alocacao distribui turmas automaticamente.",
    details: [
      "Crie um planejamento para o semestre (ex: 2026.1)",
      "Clique em \"Executar Alocacao\" — o algoritmo faz o resto",
      "Ele considera: capacidade, recursos, turno, docente",
      "Grade semanal gerada: dias x horarios x ambientes",
      "Ajuste manualmente com drag and drop se necessario",
      "Publique quando estiver satisfeito",
    ],
    color: "#f59e0b",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Dashboard e Relatorios",
    description: "Acompanhe KPIs e tome decisoes baseadas em dados.",
    details: [
      "Dashboard executivo com graficos e metricas em tempo real",
      "Ocupacao por curso, demanda por ambiente, turmas por turno",
      "Relatorios: utilizacao de ambientes, demanda pedagogica, recursos",
      "Modo consultivo: identifica gargalos e sugere acoes",
      "Exportacao PDF para compartilhar com a equipe",
    ],
    color: "#6366f1",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Comece Agora",
    description: "Siga este roteiro para configurar tudo em minutos.",
    details: [
      "1. Cadastre seus predios e ambientes",
      "2. Adicione recursos (projetores, computadores...)",
      "3. Crie cursos e disciplinas com requisitos",
      "4. Cadastre pessoas (docentes e alunos)",
      "5. Crie turmas e faca matriculas",
      "6. Crie um planejamento e execute a alocacao",
      "7. Visualize a grade e ajuste com drag and drop",
    ],
    color: "#ec4899",
  },
];

export function OnboardingWizard() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, []);

  const close = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-xl rounded-2xl border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-[var(--color-primary-light)]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: current.color,
            }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
        >
          Pular
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: i === step ? 24 : 8,
                  background: i === step ? current.color : "var(--color-primary-light)",
                }}
                onClick={() => setStep(i)}
              />
            ))}
          </div>

          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className="flex-shrink-0 rounded-xl p-3"
              style={{ background: `${current.color}15`, color: current.color }}
            >
              {current.icon}
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-[var(--color-text)]">
                {current.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {current.description}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 mt-5">
            {current.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: current.color }}
                />
                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                  {detail.includes(" — ") ? (
                    <>
                      <span className="font-semibold">{detail.split(" — ")[0]}</span>
                      {" — "}
                      {detail.split(" — ").slice(1).join(" — ")}
                    </>
                  ) : (
                    detail
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-primary-light)] px-8 py-4">
          <span className="text-xs text-[var(--color-text-muted)]">
            {step + 1} de {STEPS.length}
          </span>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="rounded-lg border border-[var(--color-primary-light)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
              >
                Anterior
              </button>
            )}
            <button
              onClick={next}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
              style={{ background: current.color }}
            >
              {isLast ? "Comecar" : "Proximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Button to reopen the onboarding from anywhere */
export function OnboardingTrigger() {
  const reopen = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <button
      onClick={reopen}
      title="Ver tour do sistema"
      className="rounded-lg p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
  );
}
