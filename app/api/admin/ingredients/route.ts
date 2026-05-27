import { NextRequest, NextResponse } from "next/server";
import { db, ingredients } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { name, unit, costPerUnit, notes } = await req.json();

  const [row] = await db
    .insert(ingredients)
    .values({ name, unit, costPerUnit: String(costPerUnit), notes: notes || null })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
