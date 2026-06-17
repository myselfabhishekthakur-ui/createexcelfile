"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  PenLine,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  delay: number;
}

function FeatureCard({ icon, title, description, href, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link href={href}>
        <div className="glass-card feature-card" id={`feature-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          <div className="feature-card-icon">{icon}</div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Hero */}
        <motion.section
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >


          <h1>
            Transform Your Data into{" "}
            <span className="gradient-text">Perfect Spreadsheets</span>
          </h1>

          <p className="hero-subtitle">
            Paste text, upload documents, or modify existing Excel files with simple
            instructions. Get production-ready .xlsx files in seconds.
          </p>

          <div className="hero-actions">
            <Link href="/convert" className="btn btn-primary btn-lg" id="cta-convert">
              <Sparkles size={18} />
              Start Converting
              <ArrowRight size={18} />
            </Link>
            <Link href="/edit" className="btn btn-secondary btn-lg" id="cta-edit">
              <PenLine size={18} />
              Edit Excel File
            </Link>
          </div>
        </motion.section>

        {/* Features */}
        <div className="features-grid">
          <FeatureCard
            icon={<FileText size={24} />}
            title="Text to Excel"
            description="Paste large datasets — CSV, tab-separated, or any structured text — and we'll automatically detect the format and generate a clean Excel file."
            href="/convert"
            delay={0.2}
          />
          <FeatureCard
            icon={<FileSpreadsheet size={24} />}
            title="Document Upload"
            description="Upload DOC or DOCX files containing tables or structured data. We extract the content and convert it into organized spreadsheets."
            href="/convert"
            delay={0.3}
          />
          <FeatureCard
            icon={<PenLine size={24} />}
            title="Smart Excel Editing"
            description="Upload an existing Excel file and give instructions like 'Add a column named Status' or 'Insert a new sheet'. We handle the rest."
            href="/edit"
            delay={0.4}
          />
        </div>
      </div>
    </div>
  );
}
