"use client";

import { Button } from "./button";

interface ExportButtonProps {
  targetId?: string; // ID of element to print, or prints whole page
}

export function ExportButton({ targetId }: ExportButtonProps) {
  const handlePrint = () => {
    if (targetId) {
      const el = document.getElementById(targetId);
      if (!el) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gestão Pedagógica - Exportação</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; margin: 2rem; color: #0a0a0a; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #e5e5e5; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            tr:nth-child(even) { background: #fafafa; }
            h1, h2, h3 { font-family: 'Space Grotesk', system-ui, sans-serif; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
            .text-muted { color: #737373; font-size: 12px; }
            .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
            .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
            .card-value { font-size: 24px; font-weight: 700; }
            .card-label { font-size: 11px; color: #737373; text-transform: uppercase; }
            @media print { body { margin: 1cm; } }
          </style>
        </head>
        <body>
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0a0a0a;padding-bottom:12px;margin-bottom:16px;">
            <div>
              <h1 style="margin:0;">Gestão Pedagógica</h1>
              <p class="text-muted" style="margin:4px 0 0;">Exportado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
          </div>
          ${el.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    } else {
      window.print();
    }
  };

  return (
    <Button variant="secondary" size="sm" title="Exportar / Imprimir" onClick={handlePrint}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    </Button>
  );
}
