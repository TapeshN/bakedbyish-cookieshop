import { NextRequest, NextResponse } from "next/server";
import { db, packaging } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, sizeFor, costPerUnit, unitsPerBox, notes } = await req.json();

  await db
    .update(packaging)
    .set({
      name,
      sizeFor,
      costPerUnit: String(costPerUnit),
      unitsPerBox: Number(unitsPerBox ?? 1),
      notes: notes || null,
    })
    .where(eq(packaging.id, Number(id)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(packaging).where(eq(packaging.id, Number(id)));
  return NextResponse.json({ ok: true });
}
