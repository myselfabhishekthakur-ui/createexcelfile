"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Sparkles } from "lucide-react";
import { TextInput } from "@/components/TextInput";
import { FileUploader } from "@/components/FileUploader";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { DownloadCard } from "@/components/DownloadCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { processText, uploadDocument, downloadFile, triggerDownload } from "@/lib/api";
import type { ProcessResult } from "@/types";

type Tab = "text" | "upload";
type Status = "idle" | "processing" | "done" | "error";

export default function ConvertPage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const canProcess =
    (activeTab === "text" && text.trim().length > 0) ||
    (activeTab === "upload" && file !== null);

  async function handleProcess() {
    setStatus("processing");
    setError(null);
    setResult(null);

    try {
      let processResult: ProcessResult;

      if (activeTab === "text") {
        setStatusMessage("Parsing text data...");
        processResult = await processText(text);
      } else {
        setStatusMessage("Processing document...");
        processResult = await uploadDocument(file!);
      }

      setResult(processResult);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
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
    setStatus("idle");
    setResult(null);
    setError(null);
    setText("");
    setFile(null);
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: "800px" }}>
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>
            Convert to <span className="gradient-text">Excel</span>
          </h1>
          <p>Paste your data or upload a document to generate a spreadsheet</p>
        </motion.div>

        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Tabs */}
            <div className="tabs" id="convert-tabs">
              <button
                className={`tab${activeTab === "text" ? " active" : ""}`}
                onClick={() => setActiveTab("text")}
                id="tab-text"
              >
                <FileText size={16} />
                Paste Text
              </button>
              <button
                className={`tab${activeTab === "upload" ? " active" : ""}`}
                onClick={() => setActiveTab("upload")}
                id="tab-upload"
              >
                <Upload size={16} />
                Upload Document
              </button>
            </div>

            {/* Content */}
            {activeTab === "text" ? (
              <div className="section">
                <TextInput
                  value={text}
                  onChange={setText}
                  id="convert-text-input"
                />
              </div>
            ) : (
              <div className="section">
                <FileUploader
                  accept={{
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                      [".docx"],
                  }}
                  onFileSelect={setFile}
                  selectedFile={file}
                  onClear={() => setFile(null)}
                  acceptLabel=".doc, .docx"
                  id="convert-file-uploader"
                />
              </div>
            )}

            {/* Action */}
            <div className="actions-row">
              <button
                className="btn btn-primary btn-lg"
                disabled={!canProcess}
                onClick={handleProcess}
                id="btn-generate"
              >
                <Sparkles size={18} />
                Generate Excel
              </button>
            </div>
          </motion.div>
        )}

        {status === "processing" && (
          <ProgressIndicator
            status={statusMessage}
            id="convert-progress"
          />
        )}

        {status === "done" && result && (
          <DownloadCard
            result={result}
            onDownload={handleDownload}
            onReset={handleReset}
            downloading={downloading}
            id="convert-download"
          />
        )}

        {error && (
          <div style={{ marginTop: "var(--space-lg)" }}>
            <ErrorBanner
              message={error}
              onDismiss={() => {
                setError(null);
                if (status === "error") setStatus("idle");
              }}
              id="convert-error"
            />
          </div>
        )}
      </div>
    </div>
  );
}
