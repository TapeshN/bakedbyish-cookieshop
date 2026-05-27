import { db, packaging } from "@/db";
import { asc } from "drizzle-orm";
import PackagingClient from "./PackagingClient";

export const dynamic = "force-dynamic";

export default async function PackagingPage() {
  const rows = await db.select().from(packaging).orderBy(asc(packaging.name));
  return <PackagingClient rows={rows} />;
}
