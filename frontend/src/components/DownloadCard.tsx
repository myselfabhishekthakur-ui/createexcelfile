"use client";

import { motion } from "framer-motion";
import { CheckCircle, Download, RotateCcw, FileSpreadsheet } from "lucide-react";
import type { ProcessResult } from "@/types";

interface DownloadCardProps {
  result: ProcessResult;
  onDownload: () => void;
  onReset: () => void;
  downloading?: boolean;
  id?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadCard({
  result,
  onDownload,
  onReset,
  downloading = false,
  id = "download-card",
}: DownloadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-card download-card" id={id}>
        <div className="download-card-header">
          <div className="download-card-icon">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="download-card-title">File Ready!</div>
            <div className="download-card-subtitle">{result.message}</div>
          </div>
        </div>

        <div className="download-card-stats">
          <div className="download-card-stat">
            <div className="download-card-stat-value">{result.sheetsCount}</div>
            <div className="download-card-stat-label">Sheets</div>
          </div>
          <div className="download-card-stat">
            <div className="download-card-stat-value">{result.rowsCount.toLocaleString()}</div>
            <div className="download-card-stat-label">Rows</div>
          </div>
          <div className="download-card-stat">
            <div className="download-card-stat-value">{result.columnsCount}</div>
            <div className="download-card-stat-label">Columns</div>
          </div>
        </div>

        <div className="file-selected">
          <div className="file-selected-icon">
            <FileSpreadsheet size={20} />
          </div>
          <div className="file-selected-info">
            <div className="file-selected-name">{result.fileName}</div>
            <div className="file-selected-size">
              {formatFileSize(result.fileSize)}
            </div>
          </div>
        </div>

        <div className="download-card-actions" style={{ marginTop: "var(--space-lg)" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={onDownload}
            disabled={downloading}
            id="btn-download"
            style={{ flex: 1 }}
          >
            <Download size={18} />
            {downloading ? "Downloading..." : "Download Excel"}
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={onReset}
            id="btn-reset"
          >
            <RotateCcw size={18} />
            New
          </button>
        </div>
      </div>
    </motion.div>
  );
}
