"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, ArrowRightLeft, PenLine, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/convert", label: "Convert", icon: ArrowRightLeft },
    { href: "/edit", label: "Edit Excel", icon: PenLine },
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <FileSpreadsheet size={20} />
          </div>
          <span>
            Excel<span className="gradient-text">Web</span>
          </span>
        </Link>

        <div className={`navbar-links${mobileOpen ? " open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-link${pathname === link.href ? " active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}
