import { NextRequest, NextResponse } from "next/server";
import { db, recipeIngredients } from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  await db
    .delete(recipeIngredients)
    .where(eq(recipeIngredients.id, Number(id)));

  return NextResponse.json({ ok: true });
}
