import { NextRequest, NextResponse } from "next/server";
import { applyStockChange } from "@/lib/stock";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, notes } = body as {
    items: Array<{ ingredientId: number; delta: number; totalCost?: number | null }>;
    notes?: string | null;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  for (const item of items) {
    if (!item.ingredientId || !item.delta || item.delta <= 0) continue;
    await applyStockChange({
      ingredientId: item.ingredientId,
      delta:        item.delta,
      reason:       "restock",
      totalCost:    item.totalCost ?? null,
      notes:        notes ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
