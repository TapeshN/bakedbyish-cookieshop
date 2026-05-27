import { NextResponse } from "next/server";
import { getBatchAvailability } from "@/lib/batch";

export const dynamic = "force-dynamic";

export async function GET() {
  const availability = await getBatchAvailability();
  return NextResponse.json(availability);
}
