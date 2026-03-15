"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f8f8]">
      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-sm px-4 lg:hidden">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="ml-3 font-[family-name:var(--font-space-grotesk)] text-base font-semibold text-[var(--color-text)]">
              Gestão Pedagógica
            </span>
          </div>
          <NotificationBell />
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex h-14 items-center justify-end border-b border-[var(--color-primary-light)] bg-[var(--color-surface)] px-6">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
