import { db, orders, weeklyBatches } from "@/db";
import { eq, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getStats() {
  const [orderStats] = await db
    .select({
      total:     sql<number>`count(*)`,
      pending:   sql<number>`count(*) filter (where status = 'pending')`,
      confirmed: sql<number>`count(*) filter (where status = 'confirmed')`,
      revenue:   sql<number>`coalesce(sum(total::numeric), 0)`,
    })
    .from(orders);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const activeBatch = await db
    .select()
    .from(weeklyBatches)
    .where(
      sql`status not in ('complete', 'cancelled')`
    )
    .orderBy(desc(weeklyBatches.createdAt))
    .limit(1);

  return { orderStats, recentOrders, activeBatch: activeBatch[0] ?? null };
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: "var(--paper)",
      border: "1.5px solid var(--line)",
      borderRadius: "1rem",
      padding: "1.25rem 1.5rem",
    }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", margin: "0 0 0.375rem" }}>
        {label}
      </p>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: accent ?? "var(--ink)", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)", margin: "0.25rem 0 0" }}>{sub}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "var(--caramel)",
  confirmed: "var(--chocolate)",
  paid:      "#2563eb",
  ready:     "#4caf50",
  delivered: "var(--ink-soft)",
  cancelled: "var(--terracotta)",
};

export default async function AdminDashboard() {
  const { orderStats, recentOrders, activeBatch } = await getStats();

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--ink-soft)", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
          Welcome back, Ish 🍪
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
        <StatCard label="Total Orders" value={Number(orderStats?.total ?? 0)} />
        <StatCard label="Pending"      value={Number(orderStats?.pending ?? 0)}   accent="var(--caramel)" />
        <StatCard label="Confirmed"    value={Number(orderStats?.confirmed ?? 0)} accent="var(--chocolate)" />
        <StatCard label="Revenue"      value={`$${Number(orderStats?.revenue ?? 0).toFixed(2)}`} accent="var(--terracotta)" />
      </div>

      {/* Active batch */}
      {activeBatch && (
        <div style={{
          background: "var(--paper)",
          border: "1.5px solid var(--line)",
          borderRadius: "1rem",
          padding: "1.25rem 1.5rem",
        }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", margin: "0 0 0.5rem" }}>
            Active Batch
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              Week of {activeBatch.weekOf}
            </p>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.25rem 0.625rem",
              borderRadius: "99px",
              background: "var(--caramel)",
              color: "var(--paper)",
              textTransform: "capitalize",
            }}>
              {activeBatch.status}
            </span>
          </div>
          {activeBatch.notes && (
            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", margin: "0.5rem 0 0" }}>
              {activeBatch.notes}
            </p>
          )}
        </div>
      )}

      {/* Recent orders */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 0.75rem" }}>
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-caveat)", fontSize: "1.125rem" }}>
            No orders yet — they'll show up here once customers start ordering 🍪
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentOrders.map((o) => (
              <div key={o.id} style={{
                background: "var(--paper)",
                border: "1.5px solid var(--line)",
                borderRadius: "0.75rem",
                padding: "0.875rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}>
                <span style={{ fontWeight: 600, color: "var(--ink)", minWidth: 24 }}>#{o.id}</span>
                <span style={{ flex: 1, color: "var(--ink)" }}>{o.customerName ?? "—"}</span>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem" }}>
                  {o.boxCount}× {o.boxSize}
                </span>
                <span style={{ fontWeight: 700, color: "var(--terracotta)" }}>${Number(o.total).toFixed(2)}</span>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "99px",
                  background: STATUS_COLORS[o.status ?? "pending"] ?? "var(--line)",
                  color: "var(--paper)",
                  textTransform: "capitalize",
                }}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
