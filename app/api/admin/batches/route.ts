import { NextRequest, NextResponse } from "next/server";
import { db, weeklyBatches } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { weekOf, notes } = await req.json();

  const [row] = await db
    .insert(weeklyBatches)
    .values({ weekOf, notes: notes ?? null, status: "planning" })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
