"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Expense = {
  id: number;
  name: string;
  category: string;
  amount: string;
  purchasedAt: string;
  usefulLifeMonths: number | null;
  notes: string | null;
};

const CATEGORIES = ["equipment", "supplies", "fees", "marketing", "other"] as const;
const CAT_EMOJI: Record<string, string> = {
  equipment: "🔧", supplies: "📦", fees: "📄", marketing: "📣", other: "•",
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: "var(--paper)", border: "1.5px solid var(--line)",
      borderRadius: "1rem", padding: "1.125rem 1.25rem",
    }}>
      <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", margin: "0 0 0.25rem" }}>{label}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: accent ?? "var(--ink)", margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)", margin: "0.25rem 0 0" }}>{sub}</p>}
    </div>
  );
}

export default function InvestmentClient({
  expenses,
  lifetimeProfit,
  lifetimeRevenue,
  lifetimeCOGS,
}: {
  expenses: Expense[];
  lifetimeProfit: number;
  lifetimeRevenue: number;
  lifetimeCOGS: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName]         = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("equipment");
  const [amount, setAmount]     = useState("");
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().slice(0, 10));
  const [life, setLife]         = useState("60");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);

  const totalInvested = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const recouped = Math.min(totalInvested, lifetimeProfit);
  const remaining = Math.max(0, totalInvested - lifetimeProfit);
  const recoupPercent = totalInvested > 0 ? (recouped / totalInvested) * 100 : 0;

  // Monthly amortization
  const monthlyAmortization = expenses.reduce((s, e) => {
    const life = e.usefulLifeMonths ?? 0;
    if (life > 0) return s + Number(e.amount) / life;
    return s;
  }, 0);

  // Average monthly profit (lifetime)
  const oldestPurchase = expenses.reduce<string | null>((min, e) => {
    if (!min || e.purchasedAt < min) return e.purchasedAt;
    return min;
  }, null);
  const monthsSinceStart = oldestPurchase
    ? Math.max(1, (Date.now() - new Date(oldestPurchase).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 1;
  const avgMonthlyProfit = lifetimeProfit / monthsSinceStart;
  const monthsToRecoup   = remaining > 0 && avgMonthlyProfit > 0 ? remaining / avgMonthlyProfit : 0;

  async function addExpense() {
    if (!name || !amount || !purchasedAt) return;
    setSaving(true);
    await fetch("/api/admin/investment", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name, category, amount, purchasedAt,
        usefulLifeMonths: life ? Number(life) : null,
        notes,
      }),
    });
    setSaving(false);
    setAdding(false);
    setName(""); setAmount(""); setNotes("");
    router.refresh();
  }

  async function remove(id: number, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    await fetch(`/api/admin/investment/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
            Investment & Recoup
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            One-time capital spend + how much of it the business has earned back.
          </p>
        </div>
        <button onClick={() => setAdding(true)} style={addBtn}>+ Add expense</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
        <StatCard label="Total Invested"      value={`$${totalInvested.toFixed(2)}`}      accent="var(--terracotta)" />
        <StatCard label="Lifetime Profit"     value={`$${lifetimeProfit.toFixed(2)}`}     accent={lifetimeProfit >= 0 ? "#16a34a" : "var(--terracotta)"} />
        <StatCard label="Still To Recoup"     value={`$${remaining.toFixed(2)}`}          sub={remaining === 0 ? "Fully recouped 🎉" : `${recoupPercent.toFixed(0)}% recovered`} />
        <StatCard label="Monthly Amortization" value={`$${monthlyAmortization.toFixed(2)}`} sub="True monthly cost of equipment" />
        {monthsToRecoup > 0 && (
          <StatCard
            label="Months to Recoup"
            value={monthsToRecoup < 1 ? "<1" : monthsToRecoup.toFixed(1)}
            sub={`at $${avgMonthlyProfit.toFixed(2)}/mo profit rate`}
          />
        )}
      </div>

      {/* Recoup progress bar */}
      {totalInvested > 0 && (
        <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "1rem", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>
              Recoup progress
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--terracotta)" }}>
              ${recouped.toFixed(0)} / ${totalInvested.toFixed(0)}
            </span>
          </div>
          <div style={{ background: "var(--paper-deep)", borderRadius: 99, height: 14, overflow: "hidden" }}>
            <div style={{
              width: `${Math.min(100, recoupPercent)}%`,
              height: "100%",
              background: recoupPercent >= 100 ? "#16a34a" : "var(--terracotta)",
              transition: "width 0.4s",
            }} />
          </div>
        </div>
      )}

      {/* Expenses table */}
      <div style={{ background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "1rem", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "var(--paper-deep)" }}>
              {["Item", "Category", "Amount", "Purchased", "Life", "Notes", ""].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr style={{ background: "#fffbf5" }}>
                <td style={td}><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. KitchenAid Pro 600" style={input} autoFocus /></td>
                <td style={td}>
                  <select value={category} onChange={e => setCategory(e.target.value as typeof CATEGORIES[number])} style={input}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                  </select>
                </td>
                <td style={td}><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="399.00" style={input} /></td>
                <td style={td}><input type="date" value={purchasedAt} onChange={e => setPurchasedAt(e.target.value)} style={input} /></td>
                <td style={td}><input type="number" value={life} onChange={e => setLife(e.target.value)} placeholder="60" style={{ ...input, width: 70 }} /></td>
                <td style={td}><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" style={input} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button onClick={addExpense} disabled={saving || !name || !amount} style={saveBtn}>{saving ? "…" : "Add"}</button>
                    <button onClick={() => setAdding(false)} style={cancelBtn}>✕</button>
                  </div>
                </td>
              </tr>
            )}
            {expenses.length === 0 && !adding && (
              <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "var(--ink-soft)", padding: "2rem" }}>
                No capital expenses tracked yet. Add equipment, license fees, ingredients you bought in bulk to start, etc.
              </td></tr>
            )}
            {expenses.map(e => (
              <tr key={e.id}>
                <td style={td}>{e.name}</td>
                <td style={td}>
                  <span style={{ fontSize: "0.75rem" }}>{CAT_EMOJI[e.category]} {e.category}</span>
                </td>
                <td style={{ ...td, fontWeight: 600 }}>${Number(e.amount).toFixed(2)}</td>
                <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>{e.purchasedAt}</td>
                <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>
                  {e.usefulLifeMonths ? `${e.usefulLifeMonths}mo` : "—"}
                </td>
                <td style={{ ...td, color: "var(--ink-soft)", fontSize: "0.8125rem" }}>{e.notes ?? "—"}</td>
                <td style={td}>
                  <button onClick={() => remove(e.id, e.name)} style={{ background: "transparent", border: "none", color: "var(--terracotta)", cursor: "pointer", fontSize: "0.875rem" }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr style={{ background: "var(--paper-deep)", fontWeight: 700 }}>
                <td style={td}>Total</td>
                <td style={td}></td>
                <td style={td}>${totalInvested.toFixed(2)}</td>
                <td colSpan={4} style={td}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontStyle: "italic", margin: 0 }}>
        * Lifetime profit = sum of (paid + ready + delivered orders) − (ingredient cost + packaging cost). Recoup time projects based on average monthly profit since first capital expense.
      </p>
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
