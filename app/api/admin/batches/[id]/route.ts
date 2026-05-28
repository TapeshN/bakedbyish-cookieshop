import { NextRequest, NextResponse } from "next/server";
import { db, weeklyBatches, batchCookies, recipeIngredients, ingredients } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const batchId = Number(id);
  const { status, notes } = await req.json();

  // Look up the previous status before we change it (for transition detection)
  const [before] = await db
    .select()
    .from(weeklyBatches)
    .where(eq(weeklyBatches.id, batchId))
    .limit(1);

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;

  await db
    .update(weeklyBatches)
    .set(update)
    .where(eq(weeklyBatches.id, batchId));

  // ── Auto-decrement stock when transitioning into "complete" ──────────
  // Stock drops once per transition only (skipped if already complete).
  if (status === "complete" && before && before.status !== "complete") {
    await decrementStockForBatch(batchId);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Decrement ingredient stock based on what got baked in this batch.
 *
 * For each (cookie, plannedQty) row in batch_cookies:
 *   1. Look up the cookie's recipe (per-cookie quantities)
 *   2. Multiply by actualQty (preferred) or plannedQty (fallback)
 *   3. Subtract from each ingredient's currentStock (floored at 0)
 */
async function decrementStockForBatch(batchId: number) {
  const items = await db
    .select()
    .from(batchCookies)
    .where(eq(batchCookies.batchId, batchId));

  // For each cookie in the batch, sum ingredient consumption
  const consumption: Record<number, number> = {}; // ingredientId → total consumed

  for (const item of items) {
    const qtyBaked = item.actualQty ?? item.plannedQty;
    if (!qtyBaked) continue;

    const recipe = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.cookieId, item.cookieId));

    for (const r of recipe) {
      const perCookie = Number(r.quantity);
      consumption[r.ingredientId] =
        (consumption[r.ingredientId] ?? 0) + perCookie * qtyBaked;
    }
  }

  // Apply each decrement
  for (const [ingId, used] of Object.entries(consumption)) {
    await db
      .update(ingredients)
      .set({
        currentStock: sql`GREATEST(0, COALESCE(${ingredients.currentStock}, 0)::numeric - ${used})`,
      })
      .where(eq(ingredients.id, Number(ingId)));
  }
}
