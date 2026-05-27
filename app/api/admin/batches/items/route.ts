import { NextRequest, NextResponse } from "next/server";
import { db, batchCookies } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { batchId, cookieId, plannedQty } = await req.json();

  const [row] = await db
    .insert(batchCookies)
    .values({
      batchId:    Number(batchId),
      cookieId:   Number(cookieId),
      plannedQty: Number(plannedQty),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
