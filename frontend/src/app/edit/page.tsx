"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, PenLine, Sparkles, Eye } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { InstructionInput } from "@/components/InstructionInput";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { DownloadCard } from "@/components/DownloadCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  previewExcel,
  modifyExcel,
  downloadFile,
  triggerDownload,
} from "@/lib/api";
import type { ProcessResult, ExcelPreview } from "@/types";

type Step = 1 | 2;
type Status = "idle" | "previewing" | "processing" | "done" | "error";

export default function EditPage() {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [preview, setPreview] = useState<ExcelPreview | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setStatus("previewing");
    setError(null);

    try {
      const previewData = await previewExcel(selectedFile);
      setPreview(previewData);
      setActiveSheet(0);
      setStep(2);
      setStatus("idle");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to preview file"
      );
      setStatus("error");
    }
  }

  async function handleModify() {
    if (!file || !instructions.trim()) return;
    setStatus("processing");
    setStatusMessage("Applying modifications...");
    setError(null);

    try {
      const processResult = await modifyExcel(file, instructions);
      setResult(processResult);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification failed");
      setStatus("error");
    }
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      const blob = await downloadFile(result.fileId);
      triggerDownload(blob, result.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setFile(null);
    setInstructions("");
    setStatus("idle");
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: "900px" }}>
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>
            Edit <span className="gradient-text">Excel</span> File
          </h1>
          <p>Upload an Excel file and modify it with simple instructions</p>
        </motion.div>

        {/* Steps indicator */}
        <div className="steps" id="edit-steps">
          <div
            className={`step${step >= 1 ? " active" : ""}${step > 1 ? " completed" : ""}`}
          >
            <span className="step-number">1</span>
            Upload File
          </div>
          <div className={`step${step >= 2 ? " active" : ""}`}>
            <span className="step-number">2</span>
            Add Instructions
          </div>
        </div>

        {status !== "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Step 1: File Upload */}
            {step === 1 && status !== "previewing" && (
              <div className="section">
                <div className="section-label">
                  <Upload size={16} />
                  Upload your Excel file
                </div>
                <FileUploader
                  accept={{
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                      [".xlsx"],
                  }}
                  onFileSelect={handleFileSelect}
                  selectedFile={null}
                  onClear={() => {}}
                  acceptLabel=".xlsx"
                  id="edit-file-uploader"
                />
              </div>
            )}

            {status === "previewing" && (
              <ProgressIndicator
                status="Reading file structure..."
                id="edit-preview-progress"
              />
            )}

            {/* Step 2: Preview + Instructions */}
            {step === 2 && status === "idle" && (
              <>
                {/* File info */}
                {file && (
                  <div className="section">
                    <FileUploader
                      accept={{
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                          [".xlsx"],
                      }}
                      onFileSelect={handleFileSelect}
                      selectedFile={file}
                      onClear={handleReset}
                      acceptLabel=".xlsx"
                      id="edit-file-display"
                    />
                  </div>
                )}

                {/* Preview */}
                {preview && (
                  <div className="section excel-preview">
                    <div className="excel-preview-header">
                      <Eye size={16} />
                      File Preview
                    </div>

                    <div className="sheet-tabs">
                      {preview.sheets.map((sheet, i) => (
                        <button
                          key={sheet.name}
                          className={`sheet-tab${activeSheet === i ? " active" : ""}`}
                          onClick={() => setActiveSheet(i)}
                        >
                          {sheet.name} ({sheet.rowCount} rows)
                        </button>
                      ))}
                    </div>

                    {preview.sheets[activeSheet] && (
                      <div className="preview-table-wrapper">
                        <table className="preview-table">
                          <thead>
                            <tr>
                              {preview.sheets[activeSheet].columns.map(
                                (col) => (
                                  <th key={col}>{col}</th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.sheets[activeSheet].sampleData.map(
                              (row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci}>{cell}</td>
                                  ))}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div className="section">
                  <div className="section-label">
                    <PenLine size={16} />
                    Modification Instructions
                  </div>
                  <InstructionInput
                    value={instructions}
                    onChange={setInstructions}
                    id="edit-instructions"
                  />
                </div>

                <div className="actions-row">
                  <button
                    className="btn btn-primary btn-lg"
                    disabled={!instructions.trim()}
                    onClick={handleModify}
                    id="btn-modify"
                  >
                    <Sparkles size={18} />
                    Apply Changes
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {status === "processing" && (
          <ProgressIndicator
            status={statusMessage}
            id="edit-progress"
          />
        )}

        {status === "done" && result && (
          <DownloadCard
            result={result}
            onDownload={handleDownload}
            onReset={handleReset}
            downloading={downloading}
            id="edit-download"
          />
        )}

        {error && (
          <div style={{ marginTop: "var(--space-lg)" }}>
            <ErrorBanner
              message={error}
              onDismiss={() => {
                setError(null);
                if (status === "error") {
                  setStatus("idle");
                  if (!preview) setStep(1);
                }
              }}
              id="edit-error"
            />
          </div>
        )}
      </div>
    </div>
  );
}
