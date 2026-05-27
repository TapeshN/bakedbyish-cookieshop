"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Packaging = {
  id: number;
  name: string;
  sizeFor: string;
  costPerUnit: string;
  unitsPerBox: number | null;
  notes: string | null;
};

const SIZES = [
  { value: "half",   label: "Half-dozen (6)" },
  { value: "dozen",  label: "Dozen (12)" },
  { value: "double", label: "Double dozen (24)" },
  { value: "all",    label: "All sizes" },
];

function Row({ row, onChange }: { row: Packaging; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(row.name);
  const [sizeFor, setSizeFor] = useState(row.sizeFor);
  const [cost, setCost]       = useState(row.costPerUnit);
  const [units, setUnits]     = useState(String(row.unitsPerBox ?? 1));
  const [notes, setNotes]     = useState(row.notes ?? "");
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/packaging/${row.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, sizeFor, costPerUnit: cost, unitsPerBox: Number(units), notes }),
    });
    setSaving(false);
    setEditing(false);
    onChange();
  }

  async function remove() {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await fetch(`/api/admin/packaging/${row.id}`, { method: "DELETE" });
    onChange();
  }

  const totalPerBox = (row.unitsPerBox ?? 1) * Number(row.costPerUnit);

  if (!editing) {
    return (
      <tr>
        <td style={td}>{row.name}</td>
        <td style={td}>
          <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: 99, background: "var(--paper-deep)", border: "1px solid var(--line)" }}>
            {SIZES.find(s => s.value === row.sizeFor)?.label ?? row.sizeFor}
          </span>
        </td>
        <td style={td}>${Number(row.costPerUnit).toFixed(4)}</td>
        <td style={td}>{row.unitsPerBox ?? 1}</td>
        <td style={{ ...td, fontWeight: 600 }}>${totalPerBox.toFixed(4)}</td>
        <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>{row.notes ?? "—"}</td>
        <td style={td}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
            <button onClick={remove} style={{ ...editBtn, color: "var(--terracotta)" }}>×</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: "var(--paper-deep)" }}>
      <td style={td}><input value={name} onChange={e => setName(e.target.value)} style={input} /></td>
      <td style={td}>
        <select value={sizeFor} onChange={e => setSizeFor(e.target.value)} style={input}>
          {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </td>
      <td style={td}><input type="number" step="0.0001" value={cost} onChange={e => setCost(e.target.value)} style={input} /></td>
      <td style={td}><input type="number" value={units} onChange={e => setUnits(e.target.value)} style={input} /></td>
      <td style={td}>—</td>
      <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} style={input} /></td>
      <td style={td}>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button onClick={save} disabled={saving} style={saveBtn}>{saving ? "…" : "Save"}</button>
          <button onClick={() => setEditing(false)} style={cancelBtn}>✕</button>
        </div>
      </td>
    </tr>
  );
}

export default function PackagingClient({ rows }: { rows: Packaging[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName]     = useState("");
  const [sizeFor, setSizeFor] = useState("dozen");
  const [cost, setCost]     = useState("");
  const [units, setUnits]   = useState("1");
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name || !cost) return;
    setSaving(true);
    await fetch("/api/admin/packaging", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, sizeFor, costPerUnit: cost, unitsPerBox: Number(units), notes }),
    });
    setSaving(false);
    setAdding(false);
    setName(""); setCost(""); setUnits("1"); setNotes("");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
            Packaging
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            Boxes, bags, twine — costs roll into per-order COGS.
          </p>
        </div>
        <button onClick={() => setAdding(true)} style={addBtn}>+ Add packaging</button>
      </div>

      <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "1rem", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "var(--paper-deep)" }}>
              {["Name", "Used for", "Cost / unit", "Units / box", "Cost / box", "Notes", ""].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr style={{ background: "#fffbf5" }}>
                <td style={td}><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kraft dozen box" style={input} autoFocus /></td>
                <td style={td}>
                  <select value={sizeFor} onChange={e => setSizeFor(e.target.value)} style={input}>
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td style={td}><input type="number" step="0.0001" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.85" style={input} /></td>
                <td style={td}><input type="number" value={units} onChange={e => setUnits(e.target.value)} style={input} /></td>
                <td style={td}>—</td>
                <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" style={input} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button onClick={add} disabled={saving || !name || !cost} style={saveBtn}>{saving ? "…" : "Add"}</button>
                    <button onClick={() => setAdding(false)} style={cancelBtn}>✕</button>
                  </div>
                </td>
              </tr>
            )}
            {rows.length === 0 && !adding && (
              <tr><td colSpan={7} style={{ ...td, color: "var(--ink-soft)", textAlign: "center", padding: "2rem" }}>
                No packaging tracked yet. Add boxes, bags, stickers, twine, etc.
              </td></tr>
            )}
            {rows.map(r => (
              <Row key={r.id} row={r} onChange={() => router.refresh()} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "0.625rem 1rem", fontWeight: 700, fontSize: "0.75rem",
  textTransform: "uppercase", letterSpacing: "0.04em",
  color: "var(--ink-soft)", textAlign: "left", borderBottom: "1px solid var(--line)",
};
const td: React.CSSProperties = {
  padding: "0.625rem 1rem", borderBottom: "1px solid var(--line)", color: "var(--ink)",
};
const input: React.CSSProperties = {
  border: "1.5px solid var(--line)", borderRadius: "0.375rem",
  padding: "0.3rem 0.5rem", fontSize: "0.875rem", width: "100%",
  background: "var(--paper)", color: "var(--ink)", boxSizing: "border-box",
};
const addBtn: React.CSSProperties = {
  background: "var(--ink)", color: "var(--paper)", border: "none",
  borderRadius: "0.5rem", padding: "0.5rem 1rem",
  fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
};
const editBtn: React.CSSProperties = {
  background: "transparent", border: "1.5px solid var(--line)",
  borderRadius: "0.375rem", padding: "0.25rem 0.625rem",
  fontSize: "0.8rem", cursor: "pointer", color: "var(--ink)",
};
const saveBtn: React.CSSProperties = {
  background: "var(--ink)", color: "var(--paper)", border: "none",
  borderRadius: "0.375rem", padding: "0.3rem 0.625rem",
  fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  background: "transparent", border: "1.5px solid var(--line)",
  borderRadius: "0.375rem", padding: "0.3rem 0.5rem",
  fontSize: "0.8125rem", cursor: "pointer", color: "var(--ink-soft)",
};
