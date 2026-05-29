/**
 * Migration: reduce menu to the 3 signature flavors.
 *
 * Strategy:
 *   - Mark every existing cookie row as inactive (active = false).
 *     This preserves recipes, past orders, batch history, and analytics
 *     — none of that breaks. They just stop showing as options going forward.
 *   - Upsert the 3 new cookies (by slug) as active = true.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npx tsx --env-file=.env.local db/migrate-to-3-flavors.ts
 */
import { db, cookies } from "./index";
import { eq } from "drizzle-orm";

const NEW_MENU = [
  {
    slug:      "white-chocolate-caramel",
    name:      "White Chocolate Caramel",
    blurb:     "Brown-butter espresso dough with creamy white chocolate puddles and pockets of soft, chewy caramel.",
    salePrice: "4.00",
    tags:      ["bestseller"],
    accent:    "var(--caramel)",
    photo:     "/cookies/white-chocolate-caramel.jpg",
  },
  {
    slug:      "dark-chocolate-toffee-nut",
    name:      "Dark Chocolate Toffee Nut",
    blurb:     "Brown-butter espresso dough loaded with dark chocolate chunks, buttery homemade toffee, and toasted pecans. Sea-salt finish.",
    salePrice: "4.00",
    tags:      ["new"],
    accent:    "var(--chocolate)",
    photo:     "/cookies/dark-chocolate-toffee-nut.jpg",
  },
  {
    slug:      "cinnamon-espresso",
    name:      "Cinnamon Espresso",
    blurb:     "Soft, chewy brown-butter espresso cookie rolled in warm cinnamon sugar. Cozy and buttery.",
    salePrice: "4.00",
    tags:      ["fan favorite"],
    accent:    "var(--terracotta)",
    photo:     "/cookies/cinnamon-espresso.jpg",
  },
];

const KEEP_SLUGS = new Set(NEW_MENU.map(c => c.slug));

async function main() {
  console.log("🍪 Migrating menu to 3 signature flavors…\n");

  // 1. Deactivate everything that isn't in the new menu
  const existing = await db.select().from(cookies);
  let deactivated = 0;
  for (const row of existing) {
    if (!KEEP_SLUGS.has(row.slug) && row.active) {
      await db.update(cookies).set({ active: false }).where(eq(cookies.id, row.id));
      console.log(`  ✗ deactivated "${row.name}"`);
      deactivated++;
    }
  }

  // 2. Upsert the 3 new cookies
  let added = 0, updated = 0;
  for (const c of NEW_MENU) {
    const found = existing.find(row => row.slug === c.slug);
    if (found) {
      await db.update(cookies).set({ ...c, active: true }).where(eq(cookies.id, found.id));
      console.log(`  ↻ updated "${c.name}"`);
      updated++;
    } else {
      await db.insert(cookies).values({ ...c, active: true });
      console.log(`  + inserted "${c.name}"`);
      added++;
    }
  }

  console.log(`\n✅ Done — ${deactivated} deactivated, ${added} added, ${updated} updated`);
  console.log(`   Public menu now shows: ${NEW_MENU.map(c => c.name).join(", ")}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
