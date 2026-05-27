"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cookie = { id: number; name: string; slug: string; salePrice: string };
type Ingredient = { id: number; name: string; unit: string; costPerUnit: string };
type RecipeIngredient = { id: number; cookieId: number; ingredientId: number; quantity: string; notes: string | null };

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
  const [addIngId, setAddIngId] = useState<number>(ingredients[0]?.id ?? 0);
  const [addQty, setAddQty]    = useState("");
  const [addNote, setAddNote]  = useState("");
  const [saving, setSaving]    = useState(false);

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

  async function addToRecipe() {
    if (!selectedCookieId || !addQty) return;
    setSaving(true);
    await fetch("/api/admin/recipes", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        cookieId:     selectedCookieId,
        ingredientId: addIngId,
        quantity:     addQty,
        notes:        addNote || null,
      }),
    });
    setSaving(false);
    setAddQty(""); setAddNote("");
    router.refresh();
  }

  async function removeFromRecipe(id: number) {
    await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
          {/* Cost summary */}
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--line)",
            background: "var(--paper-deep)",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
          }}>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", margin: 0 }}>
                Cost / cookie
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--terracotta)", margin: "0.25rem 0 0" }}>
                ${costPerCookie.toFixed(4)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", margin: 0 }}>
                Sale price
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", margin: "0.25rem 0 0" }}>
                ${Number(selectedCookie.salePrice).toFixed(2)}
              </p>
            </div>
            {margin !== null && (
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", margin: 0 }}>
                  Margin
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: 700, color: margin > 60 ? "#16a34a" : margin > 30 ? "var(--caramel)" : "var(--terracotta)", margin: "0.25rem 0 0" }}>
                  {margin.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Ingredients table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "var(--paper-deep)" }}>
                {["Ingredient", "Qty", "Unit", "Cost", "Notes", ""].map((h) => (
                  <th key={h} style={{ ...th }}>{h}</th>
                ))}
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
                const lineCost = ing ? Number(r.quantity) * Number(ing.costPerUnit) : 0;
                return (
                  <tr key={r.id}>
                    <td style={td}>{ing?.name ?? "?"}</td>
                    <td style={td}>{r.quantity}</td>
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

          {/* Add ingredient row */}
          <div style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--line)",
            background: "#fffbf5",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={labelStyle}>Ingredient</label>
              <select value={addIngId} onChange={e => setAddIngId(Number(e.target.value))} style={inputStyle}>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={labelStyle}>Quantity</label>
              <input
                type="number"
                step="0.0001"
                value={addQty}
                onChange={e => setAddQty(e.target.value)}
                placeholder="e.g. 28"
                style={{ ...inputStyle, width: 100 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
              <label style={labelStyle}>Notes (optional)</label>
              <input
                value={addNote}
                onChange={e => setAddNote(e.target.value)}
                placeholder='e.g. "browned"'
                style={inputStyle}
              />
            </div>
            <button
              onClick={addToRecipe}
              disabled={saving || !addQty}
              style={{
                background: saving || !addQty ? "var(--line)" : "var(--ink)",
                color: "var(--paper)",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: saving || !addQty ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "…" : "+ Add"}
            </button>
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
