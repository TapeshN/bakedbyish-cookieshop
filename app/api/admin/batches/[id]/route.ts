import { NextRequest, NextResponse } from "next/server";
import { db, weeklyBatches, batchCookies, recipeIngredients } from "@/db";
import { eq } from "drizzle-orm";
import { applyStockChange } from "@/lib/stock";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const batchId = Number(id);
  const { status, notes } = await req.json();

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

  // Auto-decrement stock on transition into "complete"
  if (status === "complete" && before && before.status !== "complete") {
    await decrementStockForBatch(batchId);
  }

  return NextResponse.json({ ok: true });
}

async function decrementStockForBatch(batchId: number) {
  const items = await db
    .select()
    .from(batchCookies)
    .where(eq(batchCookies.batchId, batchId));

  const consumption: Record<number, number> = {};

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

  for (const [ingId, used] of Object.entries(consumption)) {
    await applyStockChange({
      ingredientId: Number(ingId),
      delta:        -used,
      reason:       "batch_consumed",
      batchId,
      notes:        `Auto-deducted on batch #${batchId} completion`,
    });
  }
}
