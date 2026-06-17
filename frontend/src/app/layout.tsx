import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ExcelWeb — Transform Data into Excel Instantly",
  description:
    "Convert text, documents, and data into professional Excel spreadsheets. Edit existing Excel files with simple instructions. Fast, modern, and free.",
  keywords: [
    "excel",
    "spreadsheet",
    "converter",
    "data processing",
    "xlsx",
    "document to excel",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
