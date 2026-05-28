import { NextRequest, NextResponse } from "next/server";
import { db, ingredients } from "@/db";
import { eq } from "drizzle-orm";
import { applyStockChange, setStock } from "@/lib/stock";

/**
 * PATCH body shapes:
 *
 *   1. { mode: "set", value: number, notes? }            → set absolute
 *   2. { mode: "delta", value: number, reason?, totalCost?, notes? }
 *                                                        → adjust by delta
 *                                                          (reason defaults to
 *                                                           restock if delta > 0,
 *                                                           manual_adjust otherwise)
 *   3. { lowStockThreshold: number }                     → update threshold only
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ingredientId = Number(id);
  const body = await req.json();
  const { mode, value, reason, totalCost, notes, lowStockThreshold } = body;

  if (mode === "set") {
    await setStock({
      ingredientId,
      value:  Number(value),
      reason: reason ?? "manual_adjust",
      notes:  notes ?? null,
    });
  } else if (mode === "delta") {
    const delta = Number(value);
    const resolvedReason = reason ?? (delta > 0 ? "restock" : "manual_adjust");
    await applyStockChange({
      ingredientId,
      delta,
      reason: resolvedReason,
      totalCost: totalCost != null ? Number(totalCost) : null,
      notes: notes ?? null,
    });
  }

  if (lowStockThreshold !== undefined) {
    await db
      .update(ingredients)
      .set({ lowStockThreshold: String(lowStockThreshold) })
      .where(eq(ingredients.id, ingredientId));
  }

  return NextResponse.json({ ok: true });
}
