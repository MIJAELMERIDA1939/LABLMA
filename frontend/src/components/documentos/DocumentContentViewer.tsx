"use client"
import { useMemo } from "react"

interface DocumentContentViewerProps {
  contenidoHtml: string
  codigo: string
  titulo: string
  version: number
  fechaElaboracion?: string
  fechaVigencia?: string
}

export function DocumentContentViewer({
  contenidoHtml,
  codigo,
  titulo,
  version,
  fechaElaboracion,
  fechaVigencia,
}: DocumentContentViewerProps) {
  const formattedDate = useMemo(() => {
    if (!fechaElaboracion) return ""
    return new Date(fechaElaboracion).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }, [fechaElaboracion])

  const formattedVigencia = useMemo(() => {
    if (!fechaVigencia) return ""
    return new Date(fechaVigencia).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }, [fechaVigencia])

  return (
    <div className="doc-viewer">
      <style jsx>{`
        .doc-viewer {
          --doc-primary: #1a1a2e;
          --doc-accent: #2563eb;
          --doc-border: #d1d5db;
          --doc-bg: #ffffff;
          --doc-text: #1f2937;
          --doc-muted: #6b7280;
          --doc-header-bg: #f3f4f6;
          font-family: "Inter", "Segoe UI", system-ui, sans-serif;
          color: var(--doc-text);
          background: var(--doc-bg);
          line-height: 1.7;
          font-size: 14px;
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
        }

        .doc-header {
          border: 2px solid var(--doc-primary);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .doc-header-top {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0;
        }

        .doc-header-brand {
          background: var(--doc-primary);
          color: white;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .doc-header-brand .logo-placeholder {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        .doc-header-brand .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doc-header-brand .brand-text .org-name {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .doc-header-brand .brand-text .doc-type {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .doc-header-meta {
          background: var(--doc-header-bg);
          padding: 12px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
          border-left: 2px solid var(--doc-primary);
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          gap: 12px;
        }

        .meta-label {
          color: var(--doc-muted);
          font-weight: 500;
        }

        .meta-value {
          font-weight: 600;
          color: var(--doc-text);
          font-family: "JetBrains Mono", monospace;
        }

        .doc-title-section {
          background: var(--doc-primary);
          color: white;
          padding: 20px 24px;
          text-align: center;
        }

        .doc-title-section h1 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 1px;
          margin: 0;
          text-transform: uppercase;
        }

        .doc-body {
          padding: 32px 40px;
        }

        :global(.doc-body .section-title) {
          font-size: 16px;
          font-weight: 700;
          color: var(--doc-primary);
          margin-top: 28px;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid var(--doc-accent);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        :global(.doc-body .subsection-title) {
          font-size: 14px;
          font-weight: 700;
          color: var(--doc-primary);
          margin-top: 20px;
          margin-bottom: 8px;
          padding-left: 8px;
          border-left: 3px solid var(--doc-accent);
        }

        :global(.doc-body p) {
          margin-bottom: 10px;
          text-align: justify;
        }

        :global(.doc-body ul),
        :global(.doc-body ol) {
          margin: 8px 0 12px 20px;
          padding-left: 16px;
        }

        :global(.doc-body li) {
          margin-bottom: 4px;
        }

        :global(.doc-body .content-table) {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 13px;
        }

        :global(.doc-body .content-table th) {
          background: var(--doc-primary);
          color: white;
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        :global(.doc-body .content-table td) {
          padding: 9px 14px;
          border-bottom: 1px solid var(--doc-border);
          vertical-align: top;
        }

        :global(.doc-body .content-table tr:nth-child(even)) {
          background: #f9fafb;
        }

        :global(.doc-body .content-table tr:hover) {
          background: #f0f4ff;
        }

        :global(.doc-body .toc-item) {
          display: flex;
          align-items: baseline;
          padding: 6px 0;
          font-size: 13px;
          gap: 8px;
        }

        :global(.doc-body .toc-item.toc-sub) {
          padding-left: 24px;
        }

        :global(.doc-body .toc-number) {
          font-weight: 700;
          color: var(--doc-primary);
          min-width: 28px;
        }

        :global(.doc-body .toc-title) {
          font-weight: 500;
        }

        :global(.doc-body .toc-dots) {
          flex: 1;
          border-bottom: 1px dotted var(--doc-border);
          margin: 0 4px;
          min-width: 20px;
        }

        :global(.doc-body .toc-page) {
          font-weight: 600;
          color: var(--doc-muted);
          min-width: 20px;
          text-align: right;
        }

        :global(.doc-body strong) {
          font-weight: 700;
          color: var(--doc-primary);
        }

        .doc-footer {
          border-top: 2px solid var(--doc-border);
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--doc-muted);
          background: var(--doc-header-bg);
        }

        .doc-footer-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doc-footer-right {
          text-align: right;
          font-family: "JetBrains Mono", monospace;
        }

        .doc-approval-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 2px solid var(--doc-border);
        }

        .approval-cell {
          text-align: center;
          padding: 12px;
          border: 1px solid var(--doc-border);
          border-radius: 8px;
          background: var(--doc-header-bg);
        }

        .approval-cell .role {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--doc-muted);
          margin-bottom: 4px;
        }

        .approval-cell .name {
          font-size: 13px;
          font-weight: 600;
          color: var(--doc-primary);
        }

        .approval-cell .position {
          font-size: 11px;
          color: var(--doc-muted);
        }

        .approval-cell .date {
          font-size: 11px;
          font-family: "JetBrains Mono", monospace;
          color: var(--doc-muted);
          margin-top: 4px;
        }

        .print-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          justify-content: flex-end;
        }

        .print-btn {
          padding: 8px 20px;
          border: 1px solid var(--doc-border);
          border-radius: 6px;
          background: white;
          color: var(--doc-text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .print-btn:hover {
          background: var(--doc-header-bg);
          border-color: var(--doc-accent);
        }

        @media print {
          .print-controls { display: none !important; }
          .doc-viewer { box-shadow: none !important; border: none !important; }
          .doc-body { padding: 20px 30px !important; }
        }

        @media (max-width: 768px) {
          .doc-header-top { grid-template-columns: 1fr; }
          .doc-header-meta { border-left: none; border-top: 2px solid var(--doc-primary); }
          .doc-body { padding: 20px 16px; }
          .doc-approval-grid { grid-template-columns: 1fr; }
          .doc-footer { flex-direction: column; gap: 8px; text-align: center; }
          .doc-footer-right { text-align: center; }
        }
      `}</style>

      <div className="print-controls">
        <button className="print-btn" onClick={() => window.print()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimir
        </button>
      </div>

      <div className="doc-header">
        <div className="doc-header-top">
          <div className="doc-header-brand">
            <div className="logo-placeholder">LMA</div>
            <div className="brand-text">
              <span className="org-name">Universidad Autónoma Gabriel René Moreno</span>
              <span className="doc-type">Procedimiento Estándar de Operación</span>
            </div>
          </div>
          <div className="doc-header-meta">
            <div className="meta-row">
              <span className="meta-label">Fecha:</span>
              <span className="meta-value">{formattedDate}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Código:</span>
              <span className="meta-value">{codigo}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Versión:</span>
              <span className="meta-value">{String(version).padStart(2, "0")}</span>
            </div>
            {formattedVigencia && (
              <div className="meta-row">
                <span className="meta-label">Vigencia:</span>
                <span className="meta-value">{formattedVigencia}</span>
              </div>
            )}
          </div>
        </div>
        <div className="doc-title-section">
          <h1>{titulo}</h1>
        </div>
      </div>

      <div
        className="doc-body"
        dangerouslySetInnerHTML={{ __html: contenidoHtml }}
      />

      <div className="doc-footer">
        <div className="doc-footer-left">
          <span>Este documento sin el sello de &ldquo;COPIA CONTROLADA&rdquo; de color azul se constituye en &ldquo;COPIA NO CONTROLADA&rdquo;</span>
          <span>para lo cual puede consultar al Laboratorio de Medio Ambiente (LMA) sobre la vigencia del mismo</span>
        </div>
        <div className="doc-footer-right">
          © LMA, Santa Cruz de la Sierra, Bolivia
        </div>
      </div>
    </div>
  )
}
