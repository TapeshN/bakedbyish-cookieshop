import { db, cookies as cookiesTable, batchCookies, weeklyBatches, orders, orderItems, ingredients, stockTransactions } from "@/db";
import { desc, eq, ne, and, sql, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

type CookiePerf = {
  id: number;
  slug: string;
  name: string;
  batchesReleased: number;
  totalPlanned: number;
  totalSold: number;
  hitRate: number;      // % of batches where it sold out
  avgPerBatch: number;
};

export default async function InsightsPage() {
  // ── Cookie performance ────────────────────────────────────────────────
  const allCookies   = await db.select().from(cookiesTable);
  const allBatchCk   = await db.select().from(batchCookies);
  const allBatches   = await db.select().from(weeklyBatches);
  const allOItems    = await db
    .select({ slug: orderItems.cookieSlug, qty: orderItems.quantity, batchId: orders.batchId, status: orders.status })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id));

  // Map: cookieId → array of { batchId, planned }
  const byCookie: Record<number, Array<{ batchId: number; planned: number; sold: number }>> = {};

  for (const bc of allBatchCk) {
    const sold = allOItems
      .filter(o => o.batchId === bc.batchId && o.status !== "cancelled")
      .filter(o => {
        const cookie = allCookies.find(c => c.id === bc.cookieId);
        return cookie && o.slug === cookie.slug;
      })
      .reduce((s, o) => s + o.qty, 0);

    if (!byCookie[bc.cookieId]) byCookie[bc.cookieId] = [];
    byCookie[bc.cookieId].push({ batchId: bc.batchId, planned: bc.plannedQty, sold });
  }

  const perf: CookiePerf[] = allCookies
    .map(c => {
      const batches = byCookie[c.id] ?? [];
      const totalPlanned = batches.reduce((s, b) => s + b.planned, 0);
      const totalSold    = batches.reduce((s, b) => s + b.sold, 0);
      const soldOutCount = batches.filter(b => b.planned > 0 && b.sold >= b.planned).length;
      const hitRate      = batches.length > 0 ? (soldOutCount / batches.length) * 100 : 0;
      const avgPerBatch  = batches.length > 0 ? totalSold / batches.length : 0;
      return {
        id: c.id, slug: c.slug, name: c.name,
        batchesReleased: batches.length,
        totalPlanned, totalSold, hitRate, avgPerBatch,
      };
    })
    .filter(p => p.batchesReleased > 0)
    .sort((a, b) => b.totalSold - a.totalSold);

  const totalBatches = allBatches.filter(b => b.status !== "cancelled").length;
  const topCookie    = perf[0] ?? null;

  // ── Burn-rate alerts ──────────────────────────────────────────────────
  // For each ingredient, look at last 30 days of batch_consumed transactions
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentConsumption = await db
    .select({
      ingredientId: stockTransactions.ingredientId,
      delta:        stockTransactions.delta,
    })
    .from(stockTransactions)
    .where(and(
      eq(stockTransactions.reason, "batch_consumed"),
      gte(stockTransactions.createdAt, thirtyDaysAgo),
    ));

  const allIngredients = await db.select().from(ingredients);
  const usageByIng: Record<number, number> = {};
  for (const tx of recentConsumption) {
    usageByIng[tx.ingredientId] = (usageByIng[tx.ingredientId] ?? 0) + Math.abs(Number(tx.delta));
  }

  // Compute weeks-remaining at current burn rate
  const burnAlerts = allIngredients
    .map(i => {
      const usedLast30 = usageByIng[i.id] ?? 0;
      const perWeek    = usedLast30 / 4.3;  // ~weeks in 30 days
      const have       = Number(i.currentStock ?? 0);
      const weeksLeft  = perWeek > 0 ? have / perWeek : null;
      return {
        id: i.id,
        name: i.name,
        unit: i.unit,
        have,
        perWeek,
        weeksLeft,
      };
    })
    .filter(b => b.weeksLeft !== null && b.weeksLeft < 4)  // alert if < 4 weeks
    .sort((a, b) => (a.weeksLeft ?? Infinity) - (b.weeksLeft ?? Infinity));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
          Insights
        </h1>
        <p style={{ color: "var(--ink-soft)", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
          What's hitting, what's not, and what to restock next.
        </p>
      </div>

      {/* Headline cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
        <StatCard label="Total Batches" value={String(totalBatches)} />
        <StatCard label="Cookies Tracked" value={String(perf.length)} />
        {topCookie && (
          <>
            <StatCard label="Top Seller" value={topCookie.name} sub={`${topCookie.totalSold} sold`} accent="var(--terracotta)" />
            <StatCard label="Top Hit Rate" value={`${(perf[0].hitRate).toFixed(0)}%`} sub={`${topCookie.name}`} accent="#16a34a" />
          </>
        )}
      </div>

      {/* Recipe performance */}
      <div>
        <h2 style={sectionTitle}>Recipe performance</h2>
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "var(--paper-deep)" }}>
                {["#", "Cookie", "Batches", "Planned", "Sold", "Sell-through", "Hit rate", "Avg / batch"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perf.length === 0 ? (
                <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: "var(--ink-soft)", padding: "2rem" }}>
                  No batches with orders yet — once you complete a batch, this fills in.
                </td></tr>
              ) : (
                perf.map((p, i) => {
                  const sellThrough = p.totalPlanned > 0 ? (p.totalSold / p.totalPlanned) * 100 : 0;
                  const isHit       = p.hitRate >= 80;
                  const isDud       = p.batchesReleased >= 2 && sellThrough < 50;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...td, color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>
                        {isHit ? "🏆" : i + 1}
                      </td>
                      <td style={td}>
                        <strong>{p.name}</strong>
                        {isHit && <span style={{ marginLeft: 6, fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 99, background: "#16a34a", color: "#fff" }}>HIT</span>}
                        {isDud && <span style={{ marginLeft: 6, fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 99, background: "var(--ink-soft)", color: "#fff" }}>SLOW</span>}
                      </td>
                      <td style={td}>{p.batchesReleased}</td>
                      <td style={td}>{p.totalPlanned}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{p.totalSold}</td>
                      <td style={{ ...td, color: sellThrough >= 80 ? "#16a34a" : sellThrough >= 50 ? "var(--caramel)" : "var(--terracotta)", fontWeight: 600 }}>
                        {sellThrough.toFixed(0)}%
                      </td>
                      <td style={{ ...td, color: p.hitRate >= 80 ? "#16a34a" : "var(--ink)" }}>
                        {p.hitRate.toFixed(0)}%
                      </td>
                      <td style={td}>{p.avgPerBatch.toFixed(1)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p style={hint}>
          <strong>Hit rate</strong> = % of batches where this cookie sold out · <strong>Sell-through</strong> = sold / planned across all batches
        </p>
      </div>

      {/* Burn-rate alerts */}
      <div>
        <h2 style={sectionTitle}>🔥 Running low at current pace</h2>
        {burnAlerts.length === 0 ? (
          <div style={{ ...card, padding: "1.25rem 1.5rem", color: "var(--ink-soft)" }}>
            Nothing's projected to run out in the next 4 weeks. Stock looks healthy.
          </div>
        ) : (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--paper-deep)" }}>
                  {["Ingredient", "Have", "Burn / wk (30d avg)", "Weeks left"].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {burnAlerts.map(b => {
                  const wks = b.weeksLeft!;
                  const color = wks < 1 ? "var(--terracotta)" : wks < 2 ? "#f59e0b" : "var(--caramel)";
                  return (
                    <tr key={b.id}>
                      <td style={td}><strong>{b.name}</strong> <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>({b.unit})</span></td>
                      <td style={td}>{b.have.toFixed(2)}</td>
                      <td style={{ ...td, color: "var(--ink-soft)" }}>{b.perWeek.toFixed(2)}</td>
                      <td style={{ ...td, fontWeight: 700, color }}>
                        {wks < 1 ? "<1" : wks.toFixed(1)} {wks === 1 ? "wk" : "wks"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p style={hint}>
          Burn rate is averaged from completed batches in the last 30 days. Only ingredients that have been used appear here.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={card}>
      <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", margin: "0 0 0.25rem", padding: "1rem 1.25rem 0" }}>{label}</p>
      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: accent ?? "var(--ink)", margin: 0, lineHeight: 1.2, padding: "0 1.25rem 1rem" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: "-0.5rem 0 0", padding: "0 1.25rem 1rem" }}>{sub}</p>}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem",
};
const card: React.CSSProperties = {
  background: "var(--paper)", border: "1.5px solid var(--line)",
  borderRadius: "1rem", overflow: "hidden",
};
const th: React.CSSProperties = {
  padding: "0.625rem 1rem", fontWeight: 700, fontSize: "0.75rem",
  textTransform: "uppercase", letterSpacing: "0.04em",
  color: "var(--ink-soft)", textAlign: "left", borderBottom: "1px solid var(--line)",
};
const td: React.CSSProperties = {
  padding: "0.625rem 1rem", borderBottom: "1px solid var(--line)", color: "var(--ink)",
};
const hint: React.CSSProperties = {
  fontSize: "0.75rem", color: "var(--ink-soft)", fontStyle: "italic", margin: "0.5rem 0 0",
};
