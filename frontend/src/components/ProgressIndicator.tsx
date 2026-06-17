"use client";

import { useEffect, useState } from "react";

interface ProgressIndicatorProps {
  status: string;
  id?: string;
}

export function ProgressIndicator({
  status,
  id = "progress-indicator",
}: ProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulated progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card progress-wrapper" id={id}>
      <div className="progress-header">
        <div className="progress-label">
          <div className="progress-spinner" />
          Processing...
        </div>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-status">{status}</div>
    </div>
  );
}
