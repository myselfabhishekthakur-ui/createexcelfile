"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  id?: string;
}

export function ErrorBanner({
  message,
  onDismiss,
  id = "error-banner",
}: ErrorBannerProps) {
  return (
    <div className="error-banner" id={id} role="alert">
      <AlertCircle className="error-banner-icon" size={24} />
      <div className="error-banner-content">
        <div className="error-banner-title">Something went wrong</div>
        <div className="error-banner-message">{message}</div>
      </div>
      <button
        className="error-banner-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <X size={16} />
      </button>
    </div>
  );
}
