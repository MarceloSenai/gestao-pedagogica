"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Infraestrutura",
    items: [
      {
        label: "Prédios",
        href: "/predios",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" />
            <line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" />
            <line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" />
            <line x1="15" y1="14" x2="15" y2="14.01" /><line x1="9" y1="18" x2="15" y2="18" />
          </svg>
        ),
      },
      {
        label: "Ambientes",
        href: "/ambientes",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: "Recursos",
        href: "/recursos",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
      {
        label: "Chamados",
        href: "/chamados",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
        ),
      },
      {
        label: "Visão Geral",
        href: "/infraestrutura",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: "Acadêmico",
    items: [
      {
        label: "Cursos",
        href: "/cursos",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          </svg>
        ),
      },
      {
        label: "Disciplinas",
        href: "/disciplinas",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        ),
      },
      {
        label: "Pessoas",
        href: "/pessoas",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
      },
      {
        label: "Turmas",
        href: "/turmas",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
      {
        label: "Matriz de Recursos",
        href: "/matriz-recursos",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            <line x1="10" y1="6.5" x2="14" y2="6.5" /><line x1="10" y1="17.5" x2="14" y2="17.5" />
            <line x1="6.5" y1="10" x2="6.5" y2="14" /><line x1="17.5" y1="10" x2="17.5" y2="14" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Relatórios",
    items: [
      {
        label: "Visão Geral",
        href: "/relatorios",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>
          </svg>
        ),
      },
      {
        label: "Ambientes",
        href: "/relatorios/ambientes",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
      {
        label: "Demanda",
        href: "/relatorios/demanda",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
        ),
      },
      {
        label: "Recursos",
        href: "/relatorios/recursos",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        ),
      },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarWidth = collapsed ? "w-16" : "w-60";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full ${sidebarWidth} flex flex-col border-r border-[var(--color-primary-light)] bg-[var(--color-surface-dark)] transition-all duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className={`flex h-14 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-4"}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold">
              GP
            </div>
            {!collapsed && (
              <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-white truncate">
                Gestão Pedagógica
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sections.map((section) => (
            <div key={section.title || "main"} className="mb-3">
              {section.title && !collapsed && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <div className="mb-1.5 mx-auto w-8 border-t border-white/10" />
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-[var(--color-accent)] text-white shadow-sm"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10">
          {/* Version */}
          {!collapsed && (
            <div className="px-4 py-2">
              <p className="text-[11px] text-white/30 opacity-50">Build 202603151700</p>
              <p className="text-[11px] text-white/30 opacity-50">v1.0.0 — Story 1.0</p>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex w-full items-center gap-2.5 border-t border-white/10 px-4 py-3 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            >
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
