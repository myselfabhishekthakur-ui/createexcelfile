"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCheck, X } from "lucide-react";

interface FileUploaderProps {
  accept: Record<string, string[]>;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  acceptLabel: string;
  id?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({
  accept,
  onFileSelect,
  selectedFile,
  onClear,
  acceptLabel,
  id = "file-uploader",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
      setIsDragging(false);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  if (selectedFile) {
    return (
      <div className="file-selected" id={`${id}-selected`}>
        <div className="file-selected-icon">
          <FileCheck size={20} />
        </div>
        <div className="file-selected-info">
          <div className="file-selected-name">{selectedFile.name}</div>
          <div className="file-selected-size">
            {formatFileSize(selectedFile.size)}
          </div>
        </div>
        <button
          className="file-selected-remove"
          onClick={onClear}
          aria-label="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`file-uploader${isDragging ? " dragging" : ""}`}
      id={id}
    >
      <input {...getInputProps()} />
      <div className="file-uploader-icon">
        <Upload size={28} />
      </div>
      <h3>Drop your file here</h3>
      <p>or click to browse from your computer</p>
      <div className="accepted-types">
        {acceptLabel.split(",").map((type) => (
          <span key={type.trim()} className="file-type-badge">
            {type.trim()}
          </span>
        ))}
      </div>
    </div>
  );
}
