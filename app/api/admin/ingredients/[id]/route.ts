import { NextRequest, NextResponse } from "next/server";
import { db, ingredients } from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const { name, unit, costPerUnit, notes } = await req.json();

  await db
    .update(ingredients)
    .set({ name, unit, costPerUnit: String(costPerUnit), notes: notes || null })
    .where(eq(ingredients.id, Number(id)));

  return NextResponse.json({ ok: true });
}
