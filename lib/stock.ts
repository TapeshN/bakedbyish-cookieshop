import { db, ingredients, stockTransactions } from "@/db";
import { eq, sql } from "drizzle-orm";

export type StockReason = "restock" | "batch_consumed" | "manual_adjust" | "initial" | "waste";

/**
 * Apply a stock change to an ingredient AND log a transaction row in one go.
 *
 * Floors at 0 — never produces a negative balance.
 * Returns the new balance.
 */
export async function applyStockChange(opts: {
  ingredientId: number;
  delta:        number;            // signed
  reason:       StockReason;
  batchId?:     number | null;
  totalCost?:   number | null;     // for restocks
  notes?:       string | null;
}): Promise<number> {
  const { ingredientId, delta, reason, batchId = null, totalCost = null, notes = null } = opts;

  // Apply the delta. GREATEST(0, …) floors at zero.
  const [updated] = await db
    .update(ingredients)
    .set({
      currentStock:    sql`GREATEST(0, COALESCE(${ingredients.currentStock}, 0)::numeric + ${delta})`,
      lastRestockedAt: delta > 0 ? new Date() : sql`${ingredients.lastRestockedAt}`,
    })
    .where(eq(ingredients.id, ingredientId))
    .returning({ balance: ingredients.currentStock });

  const balance = Number(updated?.balance ?? 0);

  // Log it
  await db.insert(stockTransactions).values({
    ingredientId,
    delta:        String(delta),
    balanceAfter: String(balance),
    reason,
    batchId,
    totalCost:    totalCost !== null ? String(totalCost) : null,
    notes,
  });

  return balance;
}

/**
 * Set absolute stock value (rather than delta). Logs as manual_adjust unless
 * a different reason is passed.
 */
export async function setStock(opts: {
  ingredientId: number;
  value:        number;
  reason?:      StockReason;
  notes?:       string | null;
}): Promise<number> {
  const { ingredientId, value, reason = "manual_adjust", notes = null } = opts;

  // Compute delta from current value
  const [row] = await db
    .select({ current: ingredients.currentStock })
    .from(ingredients)
    .where(eq(ingredients.id, ingredientId))
    .limit(1);

  const before = Number(row?.current ?? 0);
  const delta  = value - before;

  await db
    .update(ingredients)
    .set({
      currentStock: String(value),
      lastRestockedAt: delta > 0 ? new Date() : sql`${ingredients.lastRestockedAt}`,
    })
    .where(eq(ingredients.id, ingredientId));

  await db.insert(stockTransactions).values({
    ingredientId,
    delta:        String(delta),
    balanceAfter: String(value),
    reason,
    notes,
  });

  return value;
}
