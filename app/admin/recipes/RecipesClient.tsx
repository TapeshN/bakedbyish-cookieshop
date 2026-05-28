"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cookie = { id: number; name: string; slug: string; salePrice: string };
type Ingredient = {
  id: number;
  name: string;
  unit: string;
  costPerUnit: string;
  currentStock: string | null;
};
type RecipeIngredient = {
  id: number;
  cookieId: number;
  ingredientId: number;
  quantity: string;
  notes: string | null;
};

const UNITS = ["g", "oz", "ml", "cup", "tbsp", "tsp", "each", "stick", "lb"];

export default function RecipesClient({
  cookies,
  ingredients,
  recipeIngredients,
}: {
  cookies: Cookie[];
  ingredients: Ingredient[];
  recipeIngredients: RecipeIngredient[];
}) {
  const router = useRouter();
  const [selectedCookieId, setSelectedCookieId] = useState<number | null>(cookies[0]?.id ?? null);

  // Batch mode toggle + batch size
  const [mode, setMode] = useState<"batch" | "cookie">("batch");
  const [batchSize, setBatchSize] = useState<number>(50);

  // Add-to-recipe form
  const [addIngId, setAddIngId] = useState<number>(ingredients[0]?.id ?? 0);
  const [addQty, setAddQty]     = useState("");
  const [addNote, setAddNote]   = useState("");
  const [saving, setSaving]     = useState(false);

  // Inline new-ingredient form
  const [creatingIng, setCreatingIng] = useState(false);
  const [newIngName, setNewIngName]   = useState("");
  const [newIngUnit, setNewIngUnit]   = useState("oz");
  const [newIngCost, setNewIngCost]   = useState("");

  const currentRecipe = recipeIngredients.filter((r) => r.cookieId === selectedCookieId);

  function getIngredient(id: number) {
    return ingredients.find((i) => i.id === id);
  }

  // Cost per cookie
  const costPerCookie = currentRecipe.reduce((sum, r) => {
    const ing = getIngredient(r.ingredientId);
    if (!ing) return sum;
    return sum + Number(r.quantity) * Number(ing.costPerUnit);
  }, 0);

  const selectedCookie = cookies.find((c) => c.id === selectedCookieId);
  const margin = selectedCookie
    ? ((Number(selectedCookie.salePrice) - costPerCookie) / Number(selectedCookie.salePrice)) * 100
    : null;

  // Live preview cost for what's currently in the add form
  const previewIng = getIngredient(addIngId);
  const previewQtyPerCookie = previewIng && addQty
    ? mode === "batch"
      ? Number(addQty) / batchSize
      : Number(addQty)
    : 0;
  const previewLineCost = previewIng ? previewQtyPerCookie * Number(previewIng.costPerUnit) : 0;

  async function addToRecipe() {
    if (!selectedCookieId || !addQty) return;
    setSaving(true);
    const qtyPerCookie = mode === "batch" ? Number(addQty) / batchSize : Number(addQty);
    await fetch("/api/admin/recipes", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        cookieId:     selectedCookieId,
        ingredientId: addIngId,
        quantity:     qtyPerCookie.toFixed(4),
        notes:        addNote || null,
      }),
    });
    setSaving(false);
    setAddQty(""); setAddNote("");
    router.refresh();
  }

  async function createIngredient() {
    if (!newIngName || !newIngCost) return;
    setSaving(true);
    const res = await fetch("/api/admin/ingredients", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: newIngName, unit: newIngUnit, costPerUnit: newIngCost }),
    });
    if (res.ok) {
      const created = await res.json();
      setAddIngId(created.id);                          // auto-select the new one
    }
    setCreatingIng(false);
    setNewIngName(""); setNewIngCost("");
    setSaving(false);
    router.refresh();
  }

  async function removeFromRecipe(id: number) {
    await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function marginColor(m: number) {
    if (m > 60) return "#16a34a";
    if (m > 30) return "var(--caramel)";
    return "var(--terracotta)";
  }

  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
        Recipes
      </h1>

      {/* Cookie selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {cookies.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCookieId(c.id)}
            style={{
              padding: "0.4rem 0.875rem",
              borderRadius: "99px",
              border: "1.5px solid var(--line)",
              background: selectedCookieId === c.id ? "var(--ink)" : "var(--paper)",
              color: selectedCookieId === c.id ? "var(--paper)" : "var(--ink)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {selectedCookie && (
        <div style={{
          background: "var(--paper)",
          border: "1.5px solid var(--line)",
          borderRadius: "1rem",
          overflow: "hidden",
        }}>
          {/* Cost summary + mode toggle */}
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--line)",
            background: "var(--paper-deep)",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <div>
              <p style={labelStyle}>Cost / cookie</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--terracotta)", margin: "0.25rem 0 0" }}>
                ${costPerCookie.toFixed(4)}
              </p>
            </div>
            <div>
              <p style={labelStyle}>Sale price</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", margin: "0.25rem 0 0" }}>
                ${Number(selectedCookie.salePrice).toFixed(2)}
              </p>
            </div>
            {margin !== null && (
              <div>
                <p style={labelStyle}>Margin</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, color: marginColor(margin), margin: "0.25rem 0 0" }}>
                  {margin.toFixed(1)}%
                </p>
              </div>
            )}
            <div style={{ flex: 1 }} />

            {/* Mode toggle */}
            <div style={{
              display: "inline-flex",
              padding: 3,
              background: "var(--paper)",
              border: "1.5px solid var(--line)",
              borderRadius: 99,
            }}>
              {(["batch", "cookie"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: 99,
                    border: "none",
                    background: mode === m ? "var(--ink)" : "transparent",
                    color: mode === m ? "var(--paper)" : "var(--ink-soft)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  per {m}
                </button>
              ))}
            </div>

            {mode === "batch" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>batch =</label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={e => setBatchSize(Math.max(1, Number(e.target.value)))}
                  style={{ ...inputStyle, width: 60 }}
                />
                <span style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>cookies</span>
              </div>
            )}
          </div>

          {/* Ingredients table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "var(--paper-deep)" }}>
                <th style={th}>Ingredient</th>
                <th style={th}>{mode === "batch" ? `Per batch (${batchSize})` : "Per cookie"}</th>
                <th style={th}>Unit</th>
                <th style={th}>Cost / cookie</th>
                <th style={th}>Notes</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {currentRecipe.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: "center", color: "var(--ink-soft)", padding: "1.5rem" }}>
                    No ingredients yet — add them below.
                  </td>
                </tr>
              )}
              {currentRecipe.map((r) => {
                const ing = getIngredient(r.ingredientId);
                const perCookie = Number(r.quantity);
                const display   = mode === "batch" ? perCookie * batchSize : perCookie;
                const lineCost  = ing ? perCookie * Number(ing.costPerUnit) : 0;
                return (
                  <tr key={r.id}>
                    <td style={td}>{ing?.name ?? "?"}</td>
                    <td style={td}>{display.toFixed(4)}</td>
                    <td style={{ ...td, color: "var(--ink-soft)" }}>{ing?.unit}</td>
                    <td style={td}>${lineCost.toFixed(4)}</td>
                    <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>{r.notes ?? "—"}</td>
                    <td style={td}>
                      <button
                        onClick={() => removeFromRecipe(r.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--terracotta)",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add ingredient form */}
          <div style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--line)",
            background: "#fffbf5",
          }}>
            {creatingIng ? (
              // ── Inline new-ingredient form ──────────────────────────────
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 160 }}>
                  <label style={labelStyle}>New ingredient name</label>
                  <input value={newIngName} onChange={e => setNewIngName(e.target.value)} placeholder="e.g. White chocolate chips" style={inputStyle} autoFocus />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={labelStyle}>Unit</label>
                  <select value={newIngUnit} onChange={e => setNewIngUnit(e.target.value)} style={inputStyle}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={labelStyle}>Cost / unit</label>
                  <input type="number" step="0.0001" value={newIngCost} onChange={e => setNewIngCost(e.target.value)} placeholder="0.05" style={{ ...inputStyle, width: 90 }} />
                </div>
                <button onClick={createIngredient} disabled={saving || !newIngName || !newIngCost} style={addPillBtn}>
                  {saving ? "…" : "✓ Create"}
                </button>
                <button onClick={() => setCreatingIng(false)} style={ghostBtn}>
                  Cancel
                </button>
              </div>
            ) : (
              // ── Add-to-recipe form ──────────────────────────────────────
              <>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={labelStyle}>Ingredient</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      <select value={addIngId} onChange={e => setAddIngId(Number(e.target.value))} style={{ ...inputStyle, minWidth: 200 }}>
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.unit}) — ${Number(i.costPerUnit).toFixed(4)}</option>
                        ))}
                      </select>
                      <button onClick={() => setCreatingIng(true)} title="Create new ingredient" style={{ ...ghostBtn, padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}>
                        + New
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={labelStyle}>
                      Qty {mode === "batch" ? "(per batch)" : "(per cookie)"}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={addQty}
                      onChange={e => setAddQty(e.target.value)}
                      placeholder={mode === "batch" ? "2" : "0.04"}
                      style={{ ...inputStyle, width: 110 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 140 }}>
                    <label style={labelStyle}>Notes (optional)</label>
                    <input
                      value={addNote}
                      onChange={e => setAddNote(e.target.value)}
                      placeholder='e.g. "browned"'
                      style={inputStyle}
                    />
                  </div>
                  <button onClick={addToRecipe} disabled={saving || !addQty} style={addPillBtn}>
                    {saving ? "…" : "+ Add"}
                  </button>
                </div>

                {/* Live preview */}
                {previewIng && addQty && Number(addQty) > 0 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: "0.5rem 0 0", fontStyle: "italic" }}>
                    → {previewQtyPerCookie.toFixed(4)} {previewIng.unit}/cookie ·
                    {" "}adds <strong style={{ color: "var(--terracotta)" }}>${previewLineCost.toFixed(4)}</strong> to cost/cookie
                    {" "}· new total: <strong>${(costPerCookie + previewLineCost).toFixed(4)}</strong>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {cookies.length === 0 && (
        <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-caveat)", fontSize: "1.125rem" }}>
          No cookies in the database yet — run the seed script first.
        </p>
      )}
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
  padding: "0.375rem 0.5rem",
  fontSize: "0.875rem",
  background: "var(--paper)",
  color: "var(--ink)",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--ink-soft)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const addPillBtn: React.CSSProperties = {
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
  padding: "0.5rem 0.875rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
  color: "var(--ink)",
};
