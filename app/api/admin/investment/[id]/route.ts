import { NextRequest, NextResponse } from "next/server";
import { db, capitalExpenses } from "@/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(capitalExpenses).where(eq(capitalExpenses.id, Number(id)));
  return NextResponse.json({ ok: true });
}
