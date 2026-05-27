import { NextRequest, NextResponse } from "next/server";
import { db, weeklyBatches } from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const { status, notes } = await req.json();

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;

  await db
    .update(weeklyBatches)
    .set(update)
    .where(eq(weeklyBatches.id, Number(id)));

  return NextResponse.json({ ok: true });
}
