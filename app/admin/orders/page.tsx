import { db, orders, orderItems } from "@/db";
import { desc, inArray } from "drizzle-orm";
import OrderActions from "./OrderActions";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  // Fetch items for each order
  const orderIds = allOrders.map((o) => o.id);
  const allItems = orderIds.length
    ? await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
    : [];

  const itemsByOrder = allItems.reduce<Record<number, typeof allItems>>((acc, item) => {
    acc[item.orderId] = acc[item.orderId] ?? [];
    acc[item.orderId].push(item);
    return acc;
  }, {});

  const STATUS_COLORS: Record<string, string> = {
    pending:   "#f59e0b",
    confirmed: "var(--chocolate)",
    ready:     "#16a34a",
    delivered: "var(--ink-soft)",
    cancelled: "var(--terracotta)",
  };

  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.75rem", color: "var(--ink)", margin: 0 }}>
        Orders
      </h1>

      {allOrders.length === 0 && (
        <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-caveat)", fontSize: "1.125rem" }}>
          No orders yet!
        </p>
      )}

      {allOrders.map((order) => {
        const items = itemsByOrder[order.id] ?? [];
        return (
          <div
            key={order.id}
            style={{
              background: "var(--paper)",
              border: "1.5px solid var(--line)",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--line)",
              flexWrap: "wrap",
            }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)" }}>
                #{order.id}
              </span>
              <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)" }}>
                {order.customerName ?? "Anonymous"}
              </span>
              {order.customerPhone && (
                <span style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>
                  {order.customerPhone}
                </span>
              )}
              <span style={{
                fontSize: "0.75rem", fontWeight: 600,
                padding: "0.2rem 0.625rem",
                borderRadius: "99px",
                background: STATUS_COLORS[order.status ?? "pending"],
                color: "#fff",
                textTransform: "capitalize",
              }}>
                {order.status}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>
                {new Date(order.createdAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Line items */}
            <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: "0.5rem", fontSize: "0.9rem", color: "var(--ink)" }}>
                  <span style={{ fontWeight: 600, minWidth: 20 }}>{item.quantity}×</span>
                  <span style={{ flex: 1 }}>{item.cookieName}</span>
                  <span style={{ color: "var(--ink-soft)" }}>${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              {/* Totals */}
              <div style={{ borderTop: "1px dashed var(--line)", marginTop: "0.5rem", paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {Number(order.discount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--ink-soft)" }}>
                    <span>Discount</span>
                    <span>-${Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                {Number(order.deliveryFee) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--ink-soft)" }}>
                    <span>Delivery fee</span>
                    <span>+${Number(order.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--ink)" }}>
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>
                  📦 {order.boxCount}× {order.boxSize} box
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>
                  {order.deliveryMode === "delivery" ? "🚗 Delivery" : `🏠 Pickup${order.pickupSlot ? ` (${order.pickupSlot})` : ""}`}
                </span>
              </div>
              {order.note && (
                <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", fontStyle: "italic", margin: "0.25rem 0 0" }}>
                  "{order.note}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--line)", background: "var(--paper-deep)" }}>
              <OrderActions orderId={order.id} currentStatus={order.status ?? "pending"} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
