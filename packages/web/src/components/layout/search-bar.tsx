"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  tipo: string;
  id: string;
  nome: string;
  href: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 300); // Debounce 300ms
    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const tipoColors: Record<string, string> = {
    "Predio": "bg-blue-100 text-blue-700",
    "Ambiente": "bg-green-100 text-green-700",
    "Curso": "bg-purple-100 text-purple-700",
    "Disciplina": "bg-orange-100 text-orange-700",
    "docente": "bg-indigo-100 text-indigo-700",
    "aluno": "bg-cyan-100 text-cyan-700",
    "coordenador": "bg-red-100 text-red-700",
    "secretaria": "bg-pink-100 text-pink-700",
    "gestor": "bg-yellow-100 text-yellow-700",
    "apoio_ti": "bg-gray-100 text-gray-700",
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar... (Ctrl+K)"
          className="w-64 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none transition-colors duration-150"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-transparent" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.tipo}-${r.id}`}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
            >
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tipoColors[r.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                {r.tipo}
              </span>
              <span className="text-[var(--color-text)]">{r.nome}</span>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-surface)] shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Nenhum resultado para &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
