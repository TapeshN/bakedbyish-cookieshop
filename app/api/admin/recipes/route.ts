import { NextRequest, NextResponse } from "next/server";
import { db, recipeIngredients } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { cookieId, ingredientId, quantity, notes } = await req.json();

  const [row] = await db
    .insert(recipeIngredients)
    .values({
      cookieId:     Number(cookieId),
      ingredientId: Number(ingredientId),
      quantity:     String(quantity),
      notes:        notes ?? null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
