import { NextResponse } from "next/server";
import { runFullSetup } from "@/lib/setup";

export const maxDuration = 60;  // give Neon some headroom for the multi-step setup

export async function POST() {
  const results = await runFullSetup();
  return NextResponse.json({ results });
}
