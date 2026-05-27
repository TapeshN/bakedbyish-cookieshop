import { db, cookies as cookiesTable, ingredients, recipeIngredients, orders, orderItems, packaging } from "@/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CostsPage() {
  const allCookies     = await db.select().from(cookiesTable);
  const allIngredients = await db.select().from(ingredients);
  const allRecipes     = await db.select().from(recipeIngredients);
  const recentOrders   = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50);
  const allOrderItems  = await db.select().from(orderItems);
  const allPackaging   = await db.select().from(packaging);

  // Packaging cost per box size (sum of every packaging item used per box)
  function packagingCostFor(boxSize: string): number {
    return allPackaging
      .filter((p) => p.sizeFor === boxSize || p.sizeFor === "all")
      .reduce((sum, p) => sum + (p.unitsPerBox ?? 1) * Number(p.costPerUnit), 0);
  }

  // Compute total packaging COGS across earned orders (paid+)
  const earnedOrders = recentOrders.filter((o) => o.status && !["cancelled", "pending"].includes(o.status));
  const packagingCogsTotal = earnedOrders.reduce((sum, o) => sum + packagingCostFor(o.boxSize) * o.boxCount, 0);

  // Cost per cookie
  type CookieCost = {
    id: number;
    name: string;
    slug: string;
    salePrice: number;
    costPerCookie: number;
    margin: number;
    unitsSold: number;
    revenue: number;
    cogs: number;
    profit: number;
  };

  const cookieCosts: CookieCost[] = allCookies.map((c) => {
    const recipe = allRecipes.filter((r) => r.cookieId === c.id);
    const costPerCookie = recipe.reduce((sum, r) => {
      const ing = allIngredients.find((i) => i.id === r.ingredientId);
      if (!ing) return sum;
      return sum + Number(r.quantity) * Number(ing.costPerUnit);
    }, 0);

    const salePrice = Number(c.salePrice);
    const margin = salePrice > 0 ? ((salePrice - costPerCookie) / salePrice) * 100 : 0;

    // Units sold from order items
    const sold = allOrderItems.filter((oi) => oi.cookieSlug === c.slug);
    const unitsSold = sold.reduce((s, oi) => s + oi.quantity, 0);
    const revenue   = sold.reduce((s, oi) => s + Number(oi.unitPrice) * oi.quantity, 0);
    const cogs      = unitsSold * costPerCookie;
    const profit    = revenue - cogs;

    return { id: c.id, name: c.name, slug: c.slug, salePrice, costPerCookie, margin, unitsSold, revenue, cogs, profit };
  });

  // Overall totals (ingredient COGS only)
  const totalRevenue = cookieCosts.reduce((s, c) => s + c.revenue, 0);
  const ingredientCOGS = cookieCosts.reduce((s, c) => s + c.cogs, 0);
  const totalCOGS    = ingredientCOGS + packagingCogsTotal;
  const totalProfit  = totalRevenue - totalCOGS;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  function marginColor(m: number) {
    if (m > 60) return "#16a34a";
    if (m > 30) return "#f59e0b";
    return "var(--terracotta)";
  }

  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: "2rem" }}>
      <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
        Cost & P&L
      </h1>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Revenue",   value: `$${totalRevenue.toFixed(2)}`,        accent: "var(--terracotta)" },
          { label: "Ingredient COGS", value: `$${ingredientCOGS.toFixed(2)}`,      accent: "var(--ink)" },
          { label: "Packaging COGS",  value: `$${packagingCogsTotal.toFixed(2)}`,  accent: "var(--chocolate)" },
          { label: "Gross Profit",    value: `$${totalProfit.toFixed(2)}`,         accent: "#16a34a" },
          { label: "Overall Margin",  value: `${overallMargin.toFixed(1)}%`,       accent: marginColor(overallMargin) },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{
            background: "var(--paper)",
            border: "1.5px solid var(--line)",
            borderRadius: "1rem",
            padding: "1.125rem 1.25rem",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", margin: "0 0 0.25rem" }}>{label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: accent, margin: 0, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-cookie breakdown */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          Per-Cookie Analysis
        </h2>
        <div style={{
          background: "var(--paper)",
          border: "1.5px solid var(--line)",
          borderRadius: "1rem",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--paper-deep)" }}>
                {["Cookie", "Cost/unit", "Sale price", "Margin", "Units sold", "Revenue", "COGS", "Profit"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cookieCosts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...td, textAlign: "center", color: "var(--ink-soft)", padding: "2rem" }}>
                    Add ingredients to recipes to see cost analysis.
                  </td>
                </tr>
              ) : (
                cookieCosts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ ...td, fontWeight: 600 }}>{c.name}</td>
                    <td style={td}>${c.costPerCookie.toFixed(4)}</td>
                    <td style={td}>${c.salePrice.toFixed(2)}</td>
                    <td style={{ ...td, fontWeight: 700, color: marginColor(c.margin) }}>
                      {c.margin.toFixed(1)}%
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>{c.unitsSold}</td>
                    <td style={td}>${c.revenue.toFixed(2)}</td>
                    <td style={{ ...td, color: "var(--ink-soft)" }}>${c.cogs.toFixed(2)}</td>
                    <td style={{ ...td, fontWeight: 700, color: c.profit >= 0 ? "#16a34a" : "var(--terracotta)" }}>
                      ${c.profit.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {cookieCosts.length > 0 && (
              <tfoot>
                <tr style={{ background: "var(--paper-deep)", fontWeight: 700 }}>
                  <td style={{ ...td, fontWeight: 700 }} colSpan={4}>Totals</td>
                  <td style={{ ...td, textAlign: "right" }}>{cookieCosts.reduce((s, c) => s + c.unitsSold, 0)}</td>
                  <td style={td}>${totalRevenue.toFixed(2)}</td>
                  <td style={{ ...td, color: "var(--ink-soft)" }}>${totalCOGS.toFixed(2)}</td>
                  <td style={{ ...td, color: totalProfit >= 0 ? "#16a34a" : "var(--terracotta)" }}>
                    ${totalProfit.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)", fontStyle: "italic", margin: 0 }}>
        * Costs are ingredient costs only (no labor, packaging, or delivery). Margin = (sale price − ingredient cost) / sale price.
      </p>
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
