import { NextRequest, NextResponse } from "next/server";
import { db, packaging } from "@/db";

export async function POST(req: NextRequest) {
  const { name, sizeFor, costPerUnit, unitsPerBox, notes } = await req.json();

  const [row] = await db
    .insert(packaging)
    .values({
      name,
      sizeFor,
      costPerUnit: String(costPerUnit),
      unitsPerBox: Number(unitsPerBox ?? 1),
      notes: notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
