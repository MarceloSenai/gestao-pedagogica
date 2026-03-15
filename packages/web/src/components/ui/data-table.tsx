"use client";

import type { ReactNode } from "react";
import { Button } from "./button";

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = "Nenhum registro encontrado.",
}: DataTableProps<T>) {
  const hasActions = !!onEdit || !!onDelete;

  if (data.length === 0) {
    return (
      <div className="rounded border border-[var(--color-primary-light)] p-8 text-center text-[var(--color-text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[var(--color-primary-light)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-primary-light)] bg-[var(--color-primary-light)]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left font-medium text-[var(--color-text)]"
              >
                {col.label}
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-3 text-right font-medium text-[var(--color-text)]">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b border-[var(--color-primary-light)] last:border-b-0 hover:bg-[var(--color-primary-light)] transition-colors"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3">
                  {col.render
                    ? col.render(item[col.key], item)
                    : String(item[col.key] ?? "")}
                </td>
              ))}
              {hasActions && (
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    {onEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
