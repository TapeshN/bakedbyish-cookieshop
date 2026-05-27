import { NextRequest, NextResponse } from "next/server";
import { db, capitalExpenses } from "@/db";

export async function POST(req: NextRequest) {
  const { name, category, amount, purchasedAt, usefulLifeMonths, notes } = await req.json();

  const [row] = await db
    .insert(capitalExpenses)
    .values({
      name,
      category,
      amount:           String(amount),
      purchasedAt,
      usefulLifeMonths: usefulLifeMonths ?? null,
      notes:            notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
