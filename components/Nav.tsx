"use client";

import { useEffect, useState } from "react";

export default function Nav({ onOrder }: { onOrder: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "14px 0",
        background: scrolled ? "rgba(247, 241, 230, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        borderBottom: scrolled ? "0.5px solid var(--line)" : "0.5px solid transparent",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div
        className="wrap"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <a
          href="#top"
          style={{
            textDecoration: "none",
            fontFamily: "var(--font-caprasimo), serif",
            fontSize: 22,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          BakedByIsh
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {(
            [
              ["Menu", "#menu"],
              ["Order", "#order"],
              ["Story", "#story"],
              ["Reviews", "#reviews"],
            ] as [string, string][]
          ).map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="btn btn-ghost"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {label}
            </a>
          ))}
          <button
            className="btn btn-primary"
            style={{ marginLeft: 8 }}
            onClick={onOrder}
          >
            Order pickup →
          </button>
        </div>
      </div>
    </nav>
  );
}
