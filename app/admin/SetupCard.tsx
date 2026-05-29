"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Result = { step: string; ok: boolean; detail: string };

export default function SetupCard() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [open, setOpen] = useState(false);

  async function runSetup() {
    if (!confirm("This will:\n• Apply real ingredient costs\n• Reduce menu to 3 signature flavors\n• Wire up the 3 recipes\n• Set starter pantry stock\n\nIt's safe to re-run. Continue?")) return;
    setRunning(true);
    setResults(null);
    const res = await fetch("/api/admin/setup", { method: "POST" });
    const body = await res.json();
    setResults(body.results);
    setRunning(false);
    router.refresh();
  }

  return (
    <div style={{
      background: "var(--paper)",
      border: "1.5px solid var(--line)",
      borderRadius: "1rem",
      padding: "1.25rem 1.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", margin: 0 }}>
            🛠 Initial Data Setup
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", margin: "0.25rem 0 0" }}>
            One-click: real costs · 3 flavors · recipes · starter stock. Idempotent.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setOpen(!open)} style={ghostBtn}>
            {open ? "Hide" : "Show"} details
          </button>
          <button onClick={runSetup} disabled={running} style={primaryBtn}>
            {running ? "Running…" : "Run setup"}
          </button>
        </div>
      </div>

      {open && (
        <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", fontSize: "0.8125rem", color: "var(--ink-soft)" }}>
          <li>Updates 7 ingredient costs to real values from the spreadsheet, adds cookie butter + espresso powder</li>
          <li>Deactivates old menu cookies, activates Brown Butter Biscoff / Dark Chocolate Toffee / Cinnamon Espresso</li>
          <li>Wires recipes for all 3 with per-cookie quantities (auto-creates soft caramel chunks + toffee bits)</li>
          <li>Sets opening pantry stock for 14 ingredients (~3–8 batches worth) and low-stock thresholds</li>
        </ul>
      )}

      {results && (
        <div style={{ marginTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {results.map((r, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.625rem",
              borderRadius: "0.5rem",
              background: r.ok ? "rgba(22, 163, 74, 0.08)" : "rgba(255, 100, 80, 0.12)",
              fontSize: "0.8125rem",
            }}>
              <span style={{ color: r.ok ? "#16a34a" : "var(--terracotta)", fontWeight: 700 }}>
                {r.ok ? "✓" : "✗"}
              </span>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.step}</span>
              <span style={{ color: "var(--ink-soft)" }}>— {r.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: "var(--ink)",
  color: "var(--paper)",
  border: "none",
  borderRadius: "0.5rem",
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid var(--line)",
  borderRadius: "0.5rem",
  padding: "0.4rem 0.75rem",
  fontSize: "0.8125rem",
  cursor: "pointer",
  color: "var(--ink)",
};
