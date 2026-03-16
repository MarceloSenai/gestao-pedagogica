"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy-load recharts to avoid SSR issues
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });

interface DashboardData {
  counts: Record<string, number>;
  ambientesByStatus: Record<string, number>;
  ambientesByTipo: Record<string, number>;
  capacidadeTotal: number;
  recursosByStatus: Record<string, number>;
  pessoasByPerfil: Record<string, number>;
  turmasByTurno: Record<string, number>;
  vagasTotal: number;
  ocupacaoGeral: number;
  demandaByCurso: Array<{ curso: string; turmas: number; alunos: number; vagas: number }>;
  chamadosByStatus: Record<string, number>;
  chamadosByPrioridade: Record<string, number>;
  latestPlan: { id: string; semestre: string; ano: number; status: string } | null;
  alocacaoResumo: { total: number; alocadas: number; nao_alocadas: number; conflitos: number; taxa_sucesso: number };
  notifNaoLidas: number;
}

interface Activity {
  tipo: string;
  nome: string;
  data: string;
  href: string;
}

const STATUS_COLORS: Record<string, string> = {
  ativo: "#22c55e",
  em_manutencao: "#f59e0b",
  desativado: "#ef4444",
  disponivel: "#22c55e",
  em_uso: "#3b82f6",
  indisponivel: "#ef4444",
  aberto: "#ef4444",
  em_andamento: "#f59e0b",
  resolvido: "#22c55e",
  alocada: "#22c55e",
  nao_alocada: "#ef4444",
  conflito: "#f59e0b",
};

const TURNO_COLORS: Record<string, string> = {
  manha: "#f59e0b",
  tarde: "#3b82f6",
  noite: "#6366f1",
};

const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: "#22c55e",
  media: "#f59e0b",
  alta: "#f97316",
  urgente: "#ef4444",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];

const LABELS: Record<string, string> = {
  ativo: "Ativo",
  em_manutencao: "Manutenção",
  desativado: "Desativado",
  disponivel: "Disponível",
  em_uso: "Em uso",
  indisponivel: "Indisponível",
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
  sala: "Sala",
  laboratorio: "Laboratório",
  auditorio: "Auditório",
  oficina: "Oficina",
  gestor: "Gestor",
  coordenador: "Coordenador",
  secretaria: "Secretaria",
  docente: "Docente",
  aluno: "Aluno",
  apoio_ti: "TI",
  auditor: "Auditor",
  alocada: "Alocada",
  nao_alocada: "Não alocada",
  conflito: "Conflito",
};

function label(key: string): string {
  return LABELS[key] ?? key;
}

function toChartData(obj: Record<string, number>) {
  return Object.entries(obj)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: label(name), value, key: name }));
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d atrás`;
}

// --- KPI Card ---
function KpiCard({
  title,
  value,
  subtitle,
  href,
  color = "var(--color-text)",
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  const content = (
    <div className="rounded-xl border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</p>
        {icon && <div className="text-[var(--color-text-muted)] opacity-50">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold" style={{ color }}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{content}</Link> : content;
}

// --- Mini chart card wrapper ---
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</h3>
      {children}
    </div>
  );
}

// --- Progress bar ---
function ProgressBar({ value, max, color = "#3b82f6", label: lbl }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      {lbl && <span className="w-24 truncate text-xs text-[var(--color-text-muted)]">{lbl}</span>}
      <div className="flex-1 h-2.5 rounded-full bg-[var(--color-primary-light)]">
        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-10 text-right text-xs font-medium text-[var(--color-text)]">{pct}%</span>
    </div>
  );
}

// --- Main ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/dashboard", { signal: controller.signal }).then((r) => r.ok ? r.json() : null),
      fetch("/api/atividade-recente", { signal: controller.signal }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([d, a]) => {
        setData(d);
        setActivities(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-72 animate-pulse rounded bg-[var(--color-primary-light)]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--color-primary-light)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-[var(--color-primary-light)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Erro ao carregar dados do dashboard.
      </div>
    );
  }

  const { counts, alocacaoResumo, latestPlan } = data;
  const chamadosAbertos = (data.chamadosByStatus.aberto ?? 0) + (data.chamadosByStatus.em_andamento ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-text)]">
          Dashboard — Gestão Pedagógica
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Visão executiva de infraestrutura, acadêmico e planejamento
        </p>
      </div>

      {/* ===== KPI ROW 1: Big numbers ===== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Alunos matriculados"
          value={counts.matriculas}
          subtitle={`${data.vagasTotal} vagas disponíveis`}
          href="/turmas"
          color="var(--color-accent)"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <KpiCard
          title="Turmas ativas"
          value={counts.turmas}
          subtitle={`${data.ocupacaoGeral}% ocupação geral`}
          href="/turmas"
          color="#3b82f6"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}
        />
        <KpiCard
          title="Ambientes"
          value={`${data.ambientesByStatus.ativo ?? 0}/${counts.ambientes}`}
          subtitle={`${data.capacidadeTotal} lugares totais`}
          href="/ambientes"
          color="#22c55e"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        />
        <KpiCard
          title="Chamados abertos"
          value={chamadosAbertos}
          subtitle={`${counts.chamados} total`}
          href="/chamados"
          color={chamadosAbertos > 0 ? "#ef4444" : "#22c55e"}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* ===== KPI ROW 2: Secondary counts ===== */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {[
          { title: "Prédios", value: counts.predios, href: "/predios" },
          { title: "Cursos", value: counts.cursos, href: "/cursos" },
          { title: "Disciplinas", value: counts.disciplinas, href: "/disciplinas" },
          { title: "Pessoas", value: counts.pessoas, href: "/pessoas" },
          { title: "Recursos", value: counts.recursos, href: "/recursos" },
          { title: "Planejamentos", value: counts.planejamentos, href: "/planejamentos" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-3 text-center hover:shadow-md transition-all"
          >
            <p className="text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{item.title}</p>
          </Link>
        ))}
      </div>

      {/* ===== Alocação banner (last plan) ===== */}
      {latestPlan && alocacaoResumo.total > 0 && (
        <Link
          href={`/planejamentos/${latestPlan.id}`}
          className="block rounded-xl border border-[var(--color-primary-light)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Último Planejamento — {latestPlan.semestre}/{latestPlan.ano}
              </h3>
              <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${latestPlan.status === "publicado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {latestPlan.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--color-text)]">{alocacaoResumo.taxa_sucesso}%</p>
              <p className="text-xs text-[var(--color-text-muted)]">taxa de sucesso</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", value: alocacaoResumo.total, color: "var(--color-text)" },
              { label: "Alocadas", value: alocacaoResumo.alocadas, color: "#22c55e" },
              { label: "Não alocadas", value: alocacaoResumo.nao_alocadas, color: "#ef4444" },
              { label: "Conflitos", value: alocacaoResumo.conflitos, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-[var(--color-primary-light)] overflow-hidden flex">
            {alocacaoResumo.alocadas > 0 && (
              <div style={{ width: `${(alocacaoResumo.alocadas / alocacaoResumo.total) * 100}%`, background: "#22c55e" }} className="h-full" />
            )}
            {alocacaoResumo.conflitos > 0 && (
              <div style={{ width: `${(alocacaoResumo.conflitos / alocacaoResumo.total) * 100}%`, background: "#f59e0b" }} className="h-full" />
            )}
            {alocacaoResumo.nao_alocadas > 0 && (
              <div style={{ width: `${(alocacaoResumo.nao_alocadas / alocacaoResumo.total) * 100}%`, background: "#ef4444" }} className="h-full" />
            )}
          </div>
        </Link>
      )}

      {/* ===== Charts Row 1 ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Demanda por Curso */}
        {data.demandaByCurso.length > 0 && (
          <ChartCard title="Demanda por Curso">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.demandaByCurso.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                <YAxis dataKey="curso" type="category" width={120} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-primary-light)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="alunos" name="Alunos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="vagas" name="Vagas" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Turmas por Turno */}
        <ChartCard title="Turmas por Turno">
          <div className="flex items-center gap-6">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={toChartData(data.turmasByTurno)} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                    {toChartData(data.turmasByTurno).map((entry, i) => (
                      <Cell key={i} fill={TURNO_COLORS[entry.key] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-primary-light)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {toChartData(data.turmasByTurno).map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: TURNO_COLORS[item.key] ?? "#888" }} />
                  <span className="flex-1 text-sm text-[var(--color-text)]">{item.name}</span>
                  <span className="text-sm font-bold text-[var(--color-text)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ===== Charts Row 2 ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ambientes por Status */}
        <ChartCard title="Ambientes por Status">
          <div className="space-y-3">
            {toChartData(data.ambientesByStatus).map((item) => (
              <ProgressBar
                key={item.key}
                value={item.value}
                max={counts.ambientes}
                color={STATUS_COLORS[item.key] ?? "#888"}
                label={item.name}
              />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-primary-light)]">
            <p className="text-xs text-[var(--color-text-muted)]">Por tipo:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {toChartData(data.ambientesByTipo).map((item, i) => (
                <span key={item.key} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${PIE_COLORS[i]}20`, color: PIE_COLORS[i] }}>
                  {item.name}: {item.value}
                </span>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Pessoas por Perfil */}
        <ChartCard title="Pessoas por Perfil">
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={toChartData(data.pessoasByPerfil)} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {toChartData(data.pessoasByPerfil).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-primary-light)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chamados */}
        <ChartCard title="Chamados">
          <div className="space-y-3">
            <p className="text-xs text-[var(--color-text-muted)]">Por status</p>
            {toChartData(data.chamadosByStatus).map((item) => (
              <ProgressBar
                key={item.key}
                value={item.value}
                max={counts.chamados || 1}
                color={STATUS_COLORS[item.key] ?? "#888"}
                label={item.name}
              />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-primary-light)]">
            <p className="text-xs text-[var(--color-text-muted)]">Por prioridade</p>
            <div className="mt-2 flex gap-2">
              {Object.entries(data.chamadosByPrioridade).map(([key, val]) => (
                <div key={key} className="flex-1 text-center rounded-lg p-1.5" style={{ background: `${PRIORIDADE_COLORS[key]}15` }}>
                  <p className="text-lg font-bold" style={{ color: PRIORIDADE_COLORS[key] }}>{val}</p>
                  <p className="text-[9px] font-semibold uppercase" style={{ color: PRIORIDADE_COLORS[key] }}>{label(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ===== Ocupação por Curso (bar chart) ===== */}
      {data.demandaByCurso.length > 0 && (
        <ChartCard title="Ocupação por Curso (alunos / vagas)">
          <div className="space-y-2">
            {data.demandaByCurso.map((c) => {
              const pct = c.vagas > 0 ? Math.round((c.alunos / c.vagas) * 100) : 0;
              return (
                <div key={c.curso} className="flex items-center gap-3">
                  <span className="w-36 truncate text-xs text-[var(--color-text)]">{c.curso}</span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--color-primary-light)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs text-[var(--color-text-muted)]">
                    {c.alunos}/{c.vagas}
                  </span>
                  <span className="w-10 text-right text-xs font-bold text-[var(--color-text)]">{pct}%</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

      {/* ===== Activity feed ===== */}
      {activities.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[var(--color-text)] mb-3">
            Atividade Recente
          </h2>
          <div className="rounded-xl border border-[var(--color-primary-light)] bg-[var(--color-surface)] divide-y divide-[var(--color-primary-light)]">
            {activities.map((a, i) => (
              <a
                key={i}
                href={a.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-primary-light)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                    {a.tipo}
                  </span>
                  <span className="text-sm text-[var(--color-text)]">{a.nome}</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(a.data)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
