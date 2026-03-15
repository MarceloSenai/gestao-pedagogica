"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Prédios", href: "/predios" },
  { label: "Ambientes", href: "/ambientes" },
  { label: "Recursos", href: "/recursos" },
  { label: "Cursos", href: "/cursos" },
  { label: "Disciplinas", href: "/disciplinas" },
  { label: "Pessoas", href: "/pessoas" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 transform border-r border-[var(--color-primary-light)] bg-[var(--color-surface)] transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-[var(--color-primary-light)] px-6">
          <h1 className="font-heading text-lg font-bold text-[var(--color-text)]">
            Gestão Pedagógica
          </h1>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-text)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
