import { NextRequest, NextResponse } from "next/server";
import { db, ingredients } from "@/db";
import { eq, sql } from "drizzle-orm";

/**
 * PATCH body:
 *   { mode: "set",    value: number }   → currentStock = value
 *   { mode: "delta",  value: number }   → currentStock += value (can be negative)
 *   { lowStockThreshold?: number }      → updates threshold separately
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { mode, value, lowStockThreshold } = body;

  const ingredientId = Number(id);

  if (mode === "set") {
    await db
      .update(ingredients)
      .set({
        currentStock:    String(value),
        lastRestockedAt: new Date(),
      })
      .where(eq(ingredients.id, ingredientId));
  } else if (mode === "delta") {
    await db
      .update(ingredients)
      .set({
        currentStock: sql`GREATEST(0, COALESCE(${ingredients.currentStock}, 0)::numeric + ${value})`,
        lastRestockedAt: Number(value) > 0 ? new Date() : sql`${ingredients.lastRestockedAt}`,
      })
      .where(eq(ingredients.id, ingredientId));
  }

  if (lowStockThreshold !== undefined) {
    await db
      .update(ingredients)
      .set({ lowStockThreshold: String(lowStockThreshold) })
      .where(eq(ingredients.id, ingredientId));
  }

  return NextResponse.json({ ok: true });
}
