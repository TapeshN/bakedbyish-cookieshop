"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: number;
  name: string;
  unit: string;
  costPerUnit: string;
  currentStock: string;
  threshold: number;
  need: number;
  deficit: number;
  low: boolean;
  out: boolean;
};

export default function ShoppingClient({
  rows,
  activeBatchWeek,
}: {
  rows: Row[];
  activeBatchWeek: string | null;
}) {
  const router = useRouter();

  // For each row: { qty: string, cost: string }
  const [purchases, setPurchases] = useState<Record<number, { qty: string; cost: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ count: number; totalCost: number } | null>(null);

  function update(id: number, key: "qty" | "cost", value: string) {
    setPurchases(p => ({ ...p, [id]: { ...p[id], qty: p[id]?.qty ?? "", cost: p[id]?.cost ?? "", [key]: value } }));
  }

  function prefillDeficits() {
    const next: Record<number, { qty: string; cost: string }> = {};
    for (const r of rows) {
      if (r.deficit > 0) next[r.id] = { qty: String(Math.ceil(r.deficit)), cost: "" };
    }
    setPurchases(next);
  }

  function clearAll() {
    setPurchases({});
    setDone(null);
  }

  const entries = Object.entries(purchases).filter(([, v]) => v.qty && Number(v.qty) > 0);
  const totalCost = entries.reduce((s, [, v]) => s + Number(v.cost || 0), 0);

  async function submit() {
    if (entries.length === 0) return;
    setSubmitting(true);

    const items = entries.map(([id, v]) => ({
      ingredientId: Number(id),
      delta:        Number(v.qty),
      totalCost:    v.cost ? Number(v.cost) : null,
    }));

    const res = await fetch("/api/admin/shopping", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ items, notes: activeBatchWeek ? `Shopping run for week of ${activeBatchWeek}` : null }),
    });

    setSubmitting(false);
    if (res.ok) {
      setDone({ count: items.length, totalCost });
      setPurchases({});
      router.refresh();
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{
          background: "var(--paper)",
          border: "1.5px solid var(--line)",
          borderRadius: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem" }}>🛒</div>
          <h2 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.5rem", color: "var(--ink)", margin: "0.5rem 0" }}>
            Shopping run logged!
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: 0 }}>
            Added stock for <strong>{done.count}</strong> ingredient{done.count === 1 ? "" : "s"}
            {done.totalCost > 0 && (
              <> · <strong style={{ color: "var(--terracotta)" }}>${done.totalCost.toFixed(2)}</strong> total spend</>
            )}
          </p>
          <button onClick={clearAll} style={{ ...primaryBtn, marginTop: "1.25rem" }}>+ Start another run</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
            Shopping Run
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            {activeBatchWeek
              ? <>Sorted by what you need for the <strong>week of {activeBatchWeek}</strong>. Fill in what you bought, log it all in one go.</>
              : "No active batch right now — quantities show OUT/LOW only. Fill in what you bought, log it all in one go."
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={prefillDeficits} style={ghostBtn}>Pre-fill deficits</button>
          <button onClick={clearAll} style={ghostBtn}>Clear</button>
        </div>
      </div>

      <div style={{
        background: "var(--paper)",
        border: "1.5px solid var(--line)",
        borderRadius: "1rem",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "var(--paper-deep)" }}>
              {["", "Ingredient", "Have", "Need", "Buy now", "Cost ($)"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const status = r.out ? "OUT" : r.deficit > 0 ? "DEFICIT" : r.low ? "LOW" : null;
              const color  = r.out ? "var(--terracotta)" : r.deficit > 0 ? "var(--terracotta)" : r.low ? "#f59e0b" : null;
              return (
                <tr key={r.id}>
                  <td style={{ ...td, width: 60 }}>
                    {status && (
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700,
                        padding: "0.15rem 0.5rem", borderRadius: 99,
                        background: color!, color: "#fff", letterSpacing: "0.05em",
                      }}>{status}</span>
                    )}
                  </td>
                  <td style={td}>
                    <strong>{r.name}</strong>{" "}
                    <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>
                      ({r.unit}, ${Number(r.costPerUnit).toFixed(4)}/{r.unit})
                    </span>
                  </td>
                  <td style={{ ...td, color: r.out ? "var(--terracotta)" : "var(--ink-soft)" }}>
                    {Number(r.currentStock).toFixed(2)}
                  </td>
                  <td style={{ ...td, color: r.deficit > 0 ? "var(--terracotta)" : "var(--ink-soft)", fontWeight: r.deficit > 0 ? 600 : 400 }}>
                    {r.need > 0 ? `${r.need.toFixed(2)} (${r.deficit > 0 ? `−${r.deficit.toFixed(2)}` : "ok"})` : "—"}
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      step="0.01"
                      value={purchases[r.id]?.qty ?? ""}
                      onChange={e => update(r.id, "qty", e.target.value)}
                      placeholder={r.deficit > 0 ? String(Math.ceil(r.deficit)) : "0"}
                      style={{ ...inputStyle, width: 90 }}
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      step="0.01"
                      value={purchases[r.id]?.cost ?? ""}
                      onChange={e => update(r.id, "cost", e.target.value)}
                      placeholder="$"
                      style={{ ...inputStyle, width: 90 }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr style={{ background: "var(--paper-deep)", fontWeight: 700 }}>
                <td style={td}></td>
                <td style={td}>{entries.length} item{entries.length === 1 ? "" : "s"}</td>
                <td style={td}></td>
                <td style={td}></td>
                <td style={td}></td>
                <td style={{ ...td, color: "var(--terracotta)" }}>
                  ${totalCost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Submit bar */}
      <div style={{
        position: "sticky",
        bottom: 0,
        background: "var(--paper-deep)",
        padding: "0.875rem 1.25rem",
        borderRadius: "0.75rem",
        border: "1.5px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
      }}>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.875rem" }}>
          {entries.length === 0
            ? "Enter purchases above and they'll be logged in one batch."
            : <><strong>{entries.length}</strong> item{entries.length === 1 ? "" : "s"} ready · <strong style={{ color: "var(--terracotta)" }}>${totalCost.toFixed(2)}</strong> receipt total</>
          }
        </p>
        <button onClick={submit} disabled={submitting || entries.length === 0} style={{ ...primaryBtn, opacity: submitting || entries.length === 0 ? 0.5 : 1 }}>
          {submitting ? "Logging…" : "✓ Log shopping run"}
        </button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "0.625rem 1rem",
  fontWeight: 700,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--ink-soft)",
  textAlign: "left",
  borderBottom: "1px solid var(--line)",
};
const td: React.CSSProperties = {
  padding: "0.625rem 1rem",
  borderBottom: "1px solid var(--line)",
  color: "var(--ink)",
};
const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--line)",
  borderRadius: "0.375rem",
  padding: "0.3rem 0.5rem",
  fontSize: "0.875rem",
  background: "var(--paper)",
  color: "var(--ink)",
  boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  background: "var(--ink)",
  color: "var(--paper)",
  border: "none",
  borderRadius: "0.5rem",
  padding: "0.6rem 1.25rem",
  fontSize: "0.9rem",
  fontWeight: 700,
  cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid var(--line)",
  borderRadius: "0.5rem",
  padding: "0.4rem 0.875rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
  cursor: "pointer",
  color: "var(--ink)",
};
