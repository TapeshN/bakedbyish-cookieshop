import { NextRequest, NextResponse } from "next/server";
import { db, orders } from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const { status } = await req.json();

  const valid = ["pending", "confirmed", "ready", "delivered", "cancelled"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, Number(id)));

  return NextResponse.json({ ok: true });
}
