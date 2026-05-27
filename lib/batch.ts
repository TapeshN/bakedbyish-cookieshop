import { db, weeklyBatches, batchCookies, cookies as cookiesTable, orders, orderItems } from "@/db";
import { desc, eq, and, ne, inArray } from "drizzle-orm";

/**
 * The "active" batch — the most recent one that's still accepting orders.
 * Returns null if none exists.
 */
export async function getActiveBatch() {
  // Active = status in (planning, shopping, baking) — i.e. not complete or cancelled
  const rows = await db
    .select()
    .from(weeklyBatches)
    .where(inArray(weeklyBatches.status, ["planning", "shopping", "baking"]))
    .orderBy(desc(weeklyBatches.weekOf))
    .limit(1);

  return rows[0] ?? null;
}

export type CookieAvailability = {
  slug: string;
  name: string;
  planned: number;
  sold: number;
  remaining: number;
  soldOut: boolean;
};

export type BatchAvailability = {
  batchId: number | null;
  weekOf: string | null;
  status: string | null;
  cookies: CookieAvailability[];
  totalPlanned: number;
  totalSold: number;
  totalRemaining: number;
  hasCapacityLimit: boolean;       // false when no batch is active
  fullySoldOut: boolean;           // true when every planned cookie has remaining = 0
};

/**
 * Compute how many cookies of each slug are still available in the active batch.
 *
 * Approach:
 *   - "planned" comes from batch_cookies for the active batch
 *   - "sold" comes from order_items for orders linked to that batch
 *     (any status except 'cancelled')
 *   - "remaining" = planned − sold (floored at 0)
 *
 * If no active batch exists, hasCapacityLimit = false and fullySoldOut = false
 * (i.e. orders are open with no enforced cap).
 */
export async function getBatchAvailability(): Promise<BatchAvailability> {
  const batch = await getActiveBatch();

  if (!batch) {
    return {
      batchId:          null,
      weekOf:           null,
      status:           null,
      cookies:          [],
      totalPlanned:     0,
      totalSold:        0,
      totalRemaining:   0,
      hasCapacityLimit: false,
      fullySoldOut:     false,
    };
  }

  // Planned cookies per slug
  const planned = await db
    .select({
      cookieId:   batchCookies.cookieId,
      plannedQty: batchCookies.plannedQty,
      slug:       cookiesTable.slug,
      name:       cookiesTable.name,
    })
    .from(batchCookies)
    .innerJoin(cookiesTable, eq(batchCookies.cookieId, cookiesTable.id))
    .where(eq(batchCookies.batchId, batch.id));

  // Sold per slug (orders attached to this batch, not cancelled)
  const soldRows = await db
    .select({
      cookieSlug: orderItems.cookieSlug,
      quantity:   orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.batchId, batch.id), ne(orders.status, "cancelled")));

  const soldBySlug: Record<string, number> = {};
  for (const r of soldRows) {
    soldBySlug[r.cookieSlug] = (soldBySlug[r.cookieSlug] ?? 0) + r.quantity;
  }

  const cookies: CookieAvailability[] = planned.map((p) => {
    const sold = soldBySlug[p.slug] ?? 0;
    const remaining = Math.max(0, p.plannedQty - sold);
    return {
      slug:      p.slug,
      name:      p.name,
      planned:   p.plannedQty,
      sold,
      remaining,
      soldOut:   remaining <= 0,
    };
  });

  const totalPlanned   = cookies.reduce((s, c) => s + c.planned, 0);
  const totalSold      = cookies.reduce((s, c) => s + c.sold, 0);
  const totalRemaining = cookies.reduce((s, c) => s + c.remaining, 0);

  return {
    batchId:          batch.id,
    weekOf:           batch.weekOf,
    status:           batch.status,
    cookies,
    totalPlanned,
    totalSold,
    totalRemaining,
    hasCapacityLimit: cookies.length > 0,
    fullySoldOut:     cookies.length > 0 && cookies.every((c) => c.soldOut),
  };
}
