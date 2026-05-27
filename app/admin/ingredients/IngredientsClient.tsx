"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  costPerUnit: string;
  notes: string | null;
};

const UNITS = ["g", "oz", "ml", "cup", "tbsp", "tsp", "each"];

function IngredientRow({ row, onSave }: { row: Ingredient; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(row.name);
  const [unit, setUnit]       = useState(row.unit);
  const [cost, setCost]       = useState(row.costPerUnit);
  const [notes, setNotes]     = useState(row.notes ?? "");
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/ingredients/${row.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, unit, costPerUnit: cost, notes }),
    });
    setSaving(false);
    setEditing(false);
    onSave();
  }

  if (!editing) {
    return (
      <tr>
        <td style={td}>{row.name}</td>
        <td style={td}>{row.unit}</td>
        <td style={td}>${Number(row.costPerUnit).toFixed(4)}</td>
        <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>{row.notes ?? "—"}</td>
        <td style={td}>
          <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: "var(--paper-deep)" }}>
      <td style={td}><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></td>
      <td style={td}>
        <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td style={td}><input type="number" step="0.0001" value={cost} onChange={e => setCost(e.target.value)} style={inputStyle} /></td>
      <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} placeholder="optional" /></td>
      <td style={td}>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <button onClick={save} disabled={saving} style={saveBtn}>{saving ? "…" : "Save"}</button>
          <button onClick={() => setEditing(false)} style={cancelBtn}>✕</button>
        </div>
      </td>
    </tr>
  );
}

export default function IngredientsClient({ rows }: { rows: Ingredient[] }) {
  const router = useRouter();
  const [adding, setAdding]   = useState(false);
  const [name, setName]       = useState("");
  const [unit, setUnit]       = useState("g");
  const [cost, setCost]       = useState("");
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);

  async function addIngredient() {
    if (!name || !cost) return;
    setSaving(true);
    await fetch("/api/admin/ingredients", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, unit, costPerUnit: cost, notes }),
    });
    setSaving(false);
    setAdding(false);
    setName(""); setCost(""); setNotes("");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
          Ingredients
        </h1>
        <button onClick={() => setAdding(true)} style={addBtn}>+ Add ingredient</button>
      </div>

      <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "1rem", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "var(--paper-deep)" }}>
              {["Name", "Unit", "Cost / unit", "Notes", ""].map((h) => (
                <th key={h} style={{ ...td, fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr style={{ background: "#fffbf5" }}>
                <td style={td}><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Butter" style={inputStyle} autoFocus /></td>
                <td style={td}>
                  <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td style={td}><input type="number" step="0.0001" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.0050" style={inputStyle} /></td>
                <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" style={inputStyle} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button onClick={addIngredient} disabled={saving || !name || !cost} style={saveBtn}>{saving ? "…" : "Add"}</button>
                    <button onClick={() => setAdding(false)} style={cancelBtn}>✕</button>
                  </div>
                </td>
              </tr>
            )}
            {rows.length === 0 && !adding && (
              <tr><td colSpan={5} style={{ ...td, color: "var(--ink-soft)", textAlign: "center", padding: "2rem" }}>No ingredients yet. Add your first one above.</td></tr>
            )}
            {rows.map((r) => (
              <IngredientRow key={r.id} row={r} onSave={() => router.refresh()} />
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
