"use client";

interface StatusBadgeProps {
  status: string;
  variant?: "ambiente" | "recurso" | "chamado" | "prioridade" | "planejamento" | "alocacao";
}

const colors: Record<string, Record<string, string>> = {
  ambiente: {
    ativo: "bg-green-100 text-green-700",
    em_manutencao: "bg-yellow-100 text-yellow-700",
    desativado: "bg-red-100 text-red-700",
  },
  recurso: {
    disponivel: "bg-green-100 text-green-700",
    em_uso: "bg-blue-100 text-blue-700",
    em_manutencao: "bg-yellow-100 text-yellow-700",
    indisponivel: "bg-red-100 text-red-700",
  },
  chamado: {
    aberto: "bg-red-100 text-red-700",
    em_andamento: "bg-yellow-100 text-yellow-700",
    resolvido: "bg-green-100 text-green-700",
  },
  prioridade: {
    baixa: "bg-green-100 text-green-700",
    media: "bg-yellow-100 text-yellow-700",
    alta: "bg-orange-100 text-orange-700",
    urgente: "bg-red-100 text-red-700",
  },
  planejamento: {
    rascunho: "bg-yellow-100 text-yellow-700",
    publicado: "bg-green-100 text-green-700",
  },
  alocacao: {
    alocada: "bg-green-100 text-green-700",
    nao_alocada: "bg-red-100 text-red-700",
    conflito: "bg-yellow-100 text-yellow-700",
  },
};

const labels: Record<string, string> = {
  ativo: "Ativo",
  em_manutencao: "Manutenção",
  desativado: "Desativado",
  disponivel: "Disponível",
  em_uso: "Em Uso",
  indisponivel: "Indisponível",
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
  rascunho: "Rascunho",
  publicado: "Publicado",
  alocada: "Alocada",
  nao_alocada: "Não Alocada",
  conflito: "Conflito",
};

export function StatusBadge({ status, variant = "chamado" }: StatusBadgeProps) {
  const colorClass = colors[variant]?.[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
