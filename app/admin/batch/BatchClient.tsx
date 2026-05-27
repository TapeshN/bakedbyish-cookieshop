"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Batch    = { id: number; weekOf: string; status: string | null; notes: string | null };
type Cookie   = { id: number; name: string; slug: string };
type BatchItem = { id: number; batchId: number; cookieId: number; plannedQty: number; actualQty: number | null };
type RecipeIng = { cookieId: number; ingredientId: number; quantity: string };
type Ingredient = { id: number; name: string; unit: string; costPerUnit: string };

const BATCH_STATUSES = ["planning", "shopping", "baking", "complete", "cancelled"] as const;

const STATUS_COLOR: Record<string, string> = {
  planning: "#f59e0b",
  shopping: "#3b82f6",
  baking:   "var(--terracotta)",
  complete: "#16a34a",
  cancelled:"var(--ink-soft)",
};

export default function BatchClient({
  batches,
  cookies,
  batchItems,
  recipeIngredients,
  ingredients,
  soldByBatchSlug,
}: {
  batches: Batch[];
  cookies: Cookie[];
  batchItems: BatchItem[];
  recipeIngredients: RecipeIng[];
  ingredients: Ingredient[];
  soldByBatchSlug: Record<string, number>;
}) {
  const router = useRouter();
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(batches[0]?.id ?? null);
  const [newWeekOf, setNewWeekOf] = useState("");
  const [newNotes, setNewNotes]   = useState("");
  const [creating, setCreating]   = useState(false);
  const [saving, setSaving]       = useState(false);

  // New batch cookie line
  const [addCookieId, setAddCookieId] = useState<number>(cookies[0]?.id ?? 0);
  const [addPlanned, setAddPlanned]   = useState("");

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const currentItems  = batchItems.filter((bi) => bi.batchId === selectedBatchId);

  // Shopping list: sum ingredients across all planned cookies in this batch
  const shoppingList: Record<number, number> = {};
  for (const item of currentItems) {
    const recipes = recipeIngredients.filter((r) => r.cookieId === item.cookieId);
    for (const r of recipes) {
      shoppingList[r.ingredientId] = (shoppingList[r.ingredientId] ?? 0) + Number(r.quantity) * item.plannedQty;
    }
  }

  async function createBatch() {
    if (!newWeekOf) return;
    setSaving(true);
    await fetch("/api/admin/batches", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ weekOf: newWeekOf, notes: newNotes || null }),
    });
    setSaving(false);
    setCreating(false);
    setNewWeekOf(""); setNewNotes("");
    router.refresh();
  }

  async function addCookieToBatch() {
    if (!selectedBatchId || !addPlanned) return;
    setSaving(true);
    await fetch("/api/admin/batches/items", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ batchId: selectedBatchId, cookieId: addCookieId, plannedQty: Number(addPlanned) }),
    });
    setSaving(false);
    setAddPlanned("");
    router.refresh();
  }

  async function updateStatus(status: string) {
    if (!selectedBatchId) return;
    await fetch(`/api/admin/batches/${selectedBatchId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
          Weekly Batch
        </h1>
        <button onClick={() => setCreating(true)} style={addBtn}>+ New batch</button>
      </div>

      {/* New batch form */}
      {creating && (
        <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "1rem", padding: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={labelStyle}>Week of (Saturday date)</label>
            <input type="date" value={newWeekOf} onChange={e => setNewWeekOf(e.target.value)} style={inputStyle} autoFocus />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={newNotes} onChange={e => setNewNotes(e.target.value)} style={inputStyle} placeholder="e.g. Holiday special batch" />
          </div>
          <button onClick={createBatch} disabled={saving || !newWeekOf} style={saveBtn}>{saving ? "…" : "Create"}</button>
          <button onClick={() => setCreating(false)} style={cancelBtn}>✕</button>
        </div>
      )}

      {/* Batch tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {batches.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBatchId(b.id)}
            style={{
              padding: "0.4rem 0.875rem",
              borderRadius: "99px",
              border: "1.5px solid var(--line)",
              background: selectedBatchId === b.id ? "var(--ink)" : "var(--paper)",
              color: selectedBatchId === b.id ? "var(--paper)" : "var(--ink)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {b.weekOf}
          </button>
        ))}
      </div>

      {batches.length === 0 && (
        <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-caveat)", fontSize: "1.125rem" }}>
          No batches yet — create your first one above.
        </p>
      )}

      {selectedBatch && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Left: batch plan */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{
              background: "var(--paper)",
              border: "1.5px solid var(--line)",
              borderRadius: "1rem",
              overflow: "hidden",
            }}>
              {/* Status bar */}
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--line)", background: "var(--paper-deep)", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.9375rem" }}>
                  Week of {selectedBatch.weekOf}
                </span>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 600,
                  padding: "0.2rem 0.625rem", borderRadius: "99px",
                  background: STATUS_COLOR[selectedBatch.status ?? "planning"] ?? "var(--line)",
                  color: "#fff",
                  textTransform: "capitalize",
                }}>
                  {selectedBatch.status}
                </span>
              </div>

              {/* Status transitions */}
              <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--line)", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {BATCH_STATUSES.filter(s => s !== selectedBatch.status).map((s) => (
                  <button key={s} onClick={() => updateStatus(s)} style={{ ...cancelBtn, textTransform: "capitalize", fontSize: "0.75rem" }}>
                    → {s}
                  </button>
                ))}
              </div>

              {/* Cookie list */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "var(--paper-deep)" }}>
                    {["Cookie", "Planned", "Sold", "Left", "Actual"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ ...td, textAlign: "center", color: "var(--ink-soft)", padding: "1.25rem" }}>
                        No cookies planned yet.
                      </td>
                    </tr>
                  )}
                  {currentItems.map((item) => {
                    const cookie = cookies.find((c) => c.id === item.cookieId);
                    const sold = cookie ? (soldByBatchSlug[`${selectedBatchId}:${cookie.slug}`] ?? 0) : 0;
                    const left = Math.max(0, item.plannedQty - sold);
                    const soldOut = left === 0 && item.plannedQty > 0;
                    return (
                      <tr key={item.id}>
                        <td style={td}>{cookie?.name ?? "?"}</td>
                        <td style={td}>{item.plannedQty}</td>
                        <td style={{ ...td, color: sold > 0 ? "var(--terracotta)" : "var(--ink-soft)", fontWeight: sold > 0 ? 600 : 400 }}>
                          {sold}
                        </td>
                        <td style={{ ...td, color: soldOut ? "var(--terracotta)" : left <= 3 ? "var(--caramel)" : "var(--ink)", fontWeight: 600 }}>
                          {soldOut ? "sold out" : left}
                        </td>
                        <td style={{ ...td, color: "var(--ink-soft)" }}>{item.actualQty ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add cookie to batch */}
              <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--line)", background: "#fffbf5", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                  <label style={labelStyle}>Cookie</label>
                  <select value={addCookieId} onChange={e => setAddCookieId(Number(e.target.value))} style={inputStyle}>
                    {cookies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={labelStyle}>Qty</label>
                  <input type="number" value={addPlanned} onChange={e => setAddPlanned(e.target.value)} style={{ ...inputStyle, width: 70 }} placeholder="12" />
                </div>
                <button onClick={addCookieToBatch} disabled={saving || !addPlanned} style={saveBtn}>
                  {saving ? "…" : "+ Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: shopping list */}
          <div style={{
            background: "var(--paper)",
            border: "1.5px solid var(--line)",
            borderRadius: "1rem",
            overflow: "hidden",
            alignSelf: "start",
          }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--line)", background: "var(--paper-deep)" }}>
              <p style={{ fontWeight: 700, color: "var(--ink)", margin: 0 }}>🛒 Shopping List</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "var(--paper-deep)" }}>
                  {["Ingredient", "Amount", "Unit"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(shoppingList).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ ...td, textAlign: "center", color: "var(--ink-soft)", padding: "1.25rem" }}>
                      Plan cookies first to generate shopping list.
                    </td>
                  </tr>
                )}
                {Object.entries(shoppingList).map(([ingId, total]) => {
                  const ing = ingredients.find((i) => i.id === Number(ingId));
                  return (
                    <tr key={ingId}>
                      <td style={td}>{ing?.name ?? `#${ingId}`}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{total.toFixed(2)}</td>
                      <td style={{ ...td, color: "var(--ink-soft)" }}>{ing?.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const addBtn: React.CSSProperties = {
  background: "var(--ink)", color: "var(--paper)", border: "none",
  borderRadius: "0.5rem", padding: "0.5rem 1rem",
  fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
};
const saveBtn: React.CSSProperties = {
  background: "var(--ink)", color: "var(--paper)", border: "none",
  borderRadius: "0.375rem", padding: "0.4rem 0.75rem",
  fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  background: "transparent", border: "1.5px solid var(--line)",
  borderRadius: "0.375rem", padding: "0.4rem 0.625rem",
  fontSize: "0.8125rem", cursor: "pointer", color: "var(--ink-soft)",
};
const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--line)", borderRadius: "0.375rem",
  padding: "0.375rem 0.5rem", fontSize: "0.875rem",
  background: "var(--paper)", color: "var(--ink)", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem", fontWeight: 600,
  color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em",
};
const th: React.CSSProperties = {
  padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.75rem",
  textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)",
  textAlign: "left", borderBottom: "1px solid var(--line)",
};
const td: React.CSSProperties = {
  padding: "0.5rem 1rem", borderBottom: "1px solid var(--line)", color: "var(--ink)",
};
