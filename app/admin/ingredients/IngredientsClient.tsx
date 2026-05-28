"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  costPerUnit: string;
  currentStock: string | null;
  lowStockThreshold: string | null;
  lastRestockedAt: string | null;
  notes: string | null;
};

const UNITS = ["g", "oz", "ml", "cup", "tbsp", "tsp", "each", "stick", "lb"];

function stockBadge(stock: number, threshold: number) {
  if (stock <= 0) {
    return { label: "OUT", bg: "var(--terracotta)", color: "#fff" };
  }
  if (threshold > 0 && stock <= threshold) {
    return { label: "LOW", bg: "#f59e0b", color: "#fff" };
  }
  return null;
}

function IngredientRow({ row, onChange }: { row: Ingredient; onChange: () => void }) {
  const [editing, setEditing]       = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [restockAmt, setRestockAmt] = useState("");

  const [name, setName]   = useState(row.name);
  const [unit, setUnit]   = useState(row.unit);
  const [cost, setCost]   = useState(row.costPerUnit);
  const [thresh, setThresh] = useState(row.lowStockThreshold ?? "0");
  const [notes, setNotes] = useState(row.notes ?? "");
  const [saving, setSaving] = useState(false);

  const stock     = Number(row.currentStock ?? 0);
  const threshold = Number(row.lowStockThreshold ?? 0);
  const badge     = stockBadge(stock, threshold);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/ingredients/${row.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, unit, costPerUnit: cost, notes }),
    });
    // Also save threshold via stock endpoint
    await fetch(`/api/admin/ingredients/${row.id}/stock`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ lowStockThreshold: Number(thresh) }),
    });
    setSaving(false);
    setEditing(false);
    onChange();
  }

  async function restock() {
    const amt = Number(restockAmt);
    if (!amt || amt <= 0) return;
    await fetch(`/api/admin/ingredients/${row.id}/stock`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mode: "delta", value: amt }),
    });
    setRestocking(false);
    setRestockAmt("");
    onChange();
  }

  if (editing) {
    return (
      <tr style={{ background: "var(--paper-deep)" }}>
        <td style={td}><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></td>
        <td style={td}>
          <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </td>
        <td style={td}><input type="number" step="0.0001" value={cost} onChange={e => setCost(e.target.value)} style={inputStyle} /></td>
        <td style={{ ...td, color: "var(--ink-soft)" }}>—</td>
        <td style={td}><input type="number" step="0.01" value={thresh} onChange={e => setThresh(e.target.value)} style={inputStyle} placeholder="0" /></td>
        <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} /></td>
        <td style={td}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button onClick={save} disabled={saving} style={saveBtn}>{saving ? "…" : "Save"}</button>
            <button onClick={() => setEditing(false)} style={cancelBtn}>✕</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={td}>{row.name}</td>
      <td style={td}>{row.unit}</td>
      <td style={td}>${Number(row.costPerUnit).toFixed(4)}</td>
      <td style={td}>
        {restocking ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="number"
              step="0.01"
              value={restockAmt}
              onChange={e => setRestockAmt(e.target.value)}
              placeholder={`+${row.unit}`}
              style={{ ...inputStyle, width: 70 }}
              autoFocus
            />
            <button onClick={restock} style={{ ...saveBtn, padding: "0.25rem 0.5rem" }}>+</button>
            <button onClick={() => setRestocking(false)} style={{ ...cancelBtn, padding: "0.25rem 0.4rem" }}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>{stock.toFixed(2)}</span>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>{row.unit}</span>
            {badge && (
              <span style={{
                fontSize: "0.65rem", fontWeight: 700,
                padding: "0.1rem 0.4rem", borderRadius: 99,
                background: badge.bg, color: badge.color, letterSpacing: "0.05em",
              }}>
                {badge.label}
              </span>
            )}
          </div>
        )}
      </td>
      <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>
        {threshold > 0 ? `${threshold} ${row.unit}` : "—"}
      </td>
      <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>{row.notes ?? "—"}</td>
      <td style={td}>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {!restocking && (
            <button onClick={() => setRestocking(true)} style={{ ...editBtn, color: "#16a34a", borderColor: "#16a34a" }} title="Restock">
              + Stock
            </button>
          )}
          <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
        </div>
      </td>
    </tr>
  );
}

export default function IngredientsClient({ rows }: { rows: Ingredient[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName]     = useState("");
  const [unit, setUnit]     = useState("oz");
  const [cost, setCost]     = useState("");
  const [stock, setStock]   = useState("");
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);

  async function addIngredient() {
    if (!name || !cost) return;
    setSaving(true);
    const res = await fetch("/api/admin/ingredients", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, unit, costPerUnit: cost, notes }),
    });
    if (res.ok && stock) {
      const created = await res.json();
      await fetch(`/api/admin/ingredients/${created.id}/stock`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mode: "set", value: Number(stock) }),
      });
    }
    setSaving(false);
    setAdding(false);
    setName(""); setCost(""); setStock(""); setNotes("");
    router.refresh();
  }

  // Summary
  const total       = rows.length;
  const lowStock    = rows.filter(r => {
    const s = Number(r.currentStock ?? 0);
    const t = Number(r.lowStockThreshold ?? 0);
    return s > 0 && t > 0 && s <= t;
  }).length;
  const outOfStock  = rows.filter(r => Number(r.currentStock ?? 0) <= 0).length;

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
            Ingredients
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            {total} tracked · {outOfStock > 0 && <span style={{ color: "var(--terracotta)", fontWeight: 600 }}>{outOfStock} out</span>}
            {outOfStock > 0 && lowStock > 0 && " · "}
            {lowStock > 0 && <span style={{ color: "#f59e0b", fontWeight: 600 }}>{lowStock} low</span>}
          </p>
        </div>
        <button onClick={() => setAdding(true)} style={addBtn}>+ Add ingredient</button>
      </div>

      <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "1rem", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "var(--paper-deep)" }}>
              {["Name", "Unit", "Cost / unit", "Stock", "Low at", "Notes", ""].map((h) => (
                <th key={h} style={{ ...td, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr style={{ background: "#fffbf5" }}>
                <td style={td}><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. White chocolate chips" style={inputStyle} autoFocus /></td>
                <td style={td}>
                  <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td style={td}><input type="number" step="0.0001" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.0050" style={inputStyle} /></td>
                <td style={td}><input type="number" step="0.01" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={inputStyle} /></td>
                <td style={{ ...td, color: "var(--ink-soft)" }}>—</td>
                <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" style={inputStyle} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button onClick={addIngredient} disabled={saving || !name || !cost} style={saveBtn}>{saving ? "…" : "Add"}</button>
                    <button onClick={() => setAdding(false)} style={cancelBtn}>✕</button>
                  </div>
                </td>
              </tr>
            )}
            {rows.length === 0 && !adding && (
              <tr><td colSpan={7} style={{ ...td, color: "var(--ink-soft)", textAlign: "center", padding: "2rem" }}>No ingredients yet. Add your first one above.</td></tr>
            )}
            {rows.map((r) => (
              <IngredientRow key={r.id} row={r} onChange={() => router.refresh()} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const td: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderBottom: "1px solid var(--line)",
  color: "var(--ink)",
  textAlign: "left",
};
const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--line)",
  borderRadius: "0.375rem",
  padding: "0.3rem 0.5rem",
  fontSize: "0.875rem",
  width: "100%",
  background: "var(--paper)",
  color: "var(--ink)",
  boxSizing: "border-box",
};
const addBtn: React.CSSProperties = {
  background: "var(--ink)",
  color: "var(--paper)",
  border: "none",
  borderRadius: "0.5rem",
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};
const editBtn: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid var(--line)",
  borderRadius: "0.375rem",
  padding: "0.25rem 0.625rem",
  fontSize: "0.8rem",
  cursor: "pointer",
  color: "var(--ink)",
};
const saveBtn: React.CSSProperties = {
  background: "var(--ink)",
  color: "var(--paper)",
  border: "none",
  borderRadius: "0.375rem",
  padding: "0.3rem 0.625rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid var(--line)",
  borderRadius: "0.375rem",
  padding: "0.3rem 0.5rem",
  fontSize: "0.8125rem",
  cursor: "pointer",
  color: "var(--ink-soft)",
};
