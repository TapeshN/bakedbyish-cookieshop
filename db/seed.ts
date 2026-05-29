/**
 * Seed script — run once after `npx drizzle-kit push` to populate
 * the cookies and a starter set of ingredients.
 *
 * Usage:
 *   npx tsx db/seed.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, cookies, ingredients, packaging } from "./index";

async function main() {
  console.log("🍪 Seeding cookies…");

  await db
    .insert(cookies)
    .values([
      {
        slug:      "brown-butter-biscoff",
        name:      "Brown Butter Biscoff",
        blurb:     "Brown-butter espresso dough loaded with white chocolate puddles and pockets of soft, chewy caramel.",
        salePrice: "4.00",
        active:    true,
        tags:      ["bestseller"],
        accent:    "var(--caramel)",
        photo:     "/cookies/hero-stack.png",
      },
      {
        slug:      "dark-chocolate-toffee",
        name:      "Dark Chocolate Toffee",
        blurb:     "Brown-butter espresso dough with dark chocolate chunks and shards of homemade buttery toffee.",
        salePrice: "4.00",
        active:    true,
        tags:      ["new"],
        accent:    "var(--chocolate)",
        photo:     "/cookies/oatmeal-plate.png",
      },
      {
        slug:      "cinnamon-espresso",
        name:      "Cinnamon Espresso",
        blurb:     "Soft, chewy brown-butter espresso cookie rolled in warm cinnamon sugar. Cozy and buttery.",
        salePrice: "4.00",
        active:    true,
        tags:      ["fan favorite"],
        accent:    "var(--terracotta)",
        photo:     "/cookies/snickerdoodles.png",
      },
    ])
    .onConflictDoNothing();

  console.log("🧂 Seeding ingredients…");

  await db
    .insert(ingredients)
    .values([
      // ── Real costs from Ish's dough spreadsheet ────────────────────────
      { name: "Unsalted butter",     unit: "stick", costPerUnit: "0.7650", notes: "$3.06 per lb (4 sticks)" },
      { name: "White sugar",         unit: "oz",    costPerUnit: "0.0488", notes: "$3.12 per 4 lb bag" },
      { name: "Brown sugar",         unit: "oz",    costPerUnit: "0.1169", notes: "$3.74 per 2 lb bag" },
      { name: "All-purpose flour",   unit: "oz",    costPerUnit: "0.0294", notes: "$2.35 per 5 lb bag" },
      { name: "Eggs",                unit: "each",  costPerUnit: "0.1188", notes: "$7.13 per 5 dozen" },
      { name: "Vanilla extract",     unit: "tsp",   costPerUnit: "0.1094", notes: "$3.94 per 6 oz (36 tsp)" },
      { name: "Baking soda",         unit: "oz",    costPerUnit: "0.0575", notes: "$0.92 per 1 lb box" },
      { name: "Cookie butter",       unit: "oz",    costPerUnit: "0.1954", notes: "$5.47 per 1.75 lb jar" },
      { name: "Espresso powder",     unit: "g",     costPerUnit: "0.0909", notes: "$9.00 per 99 g tin" },
      { name: "Salt",                unit: "g",    costPerUnit: "0.0010" },
      { name: "White chocolate chips", unit: "g",  costPerUnit: "0.0200" },
      { name: "Dark chocolate chips",  unit: "g",  costPerUnit: "0.0180" },
      { name: "Cinnamon",            unit: "g",    costPerUnit: "0.0080" },
      { name: "Rolled oats",         unit: "g",    costPerUnit: "0.0025" },
      { name: "Shredded coconut",    unit: "g",    costPerUnit: "0.0150" },
      { name: "Tahini",              unit: "g",    costPerUnit: "0.0200" },
      { name: "Cream of tartar",     unit: "g",    costPerUnit: "0.0120" },
      { name: "Baking powder",       unit: "g",    costPerUnit: "0.0050" },
      { name: "Sprinkles",           unit: "g",    costPerUnit: "0.0250" },
      { name: "Cocoa powder",        unit: "g",    costPerUnit: "0.0120" },
      { name: "Graham crackers",     unit: "g",    costPerUnit: "0.0180" },
      { name: "Mini marshmallows",   unit: "g",    costPerUnit: "0.0120" },
      { name: "Lemon zest",          unit: "g",    costPerUnit: "0.0500" },
      { name: "Poppy seeds",         unit: "g",    costPerUnit: "0.0350" },
      { name: "Powdered sugar",      unit: "g",    costPerUnit: "0.0020" },
      { name: "Cream cheese",        unit: "g",    costPerUnit: "0.0200" },
      { name: "Milk chocolate chips", unit: "g",   costPerUnit: "0.0170" },
    ])
    .onConflictDoNothing();

  console.log("🎁 Seeding packaging…");

  await db
    .insert(packaging)
    .values([
      { name: "Half-dozen kraft box",   sizeFor: "half",   costPerUnit: "0.65", unitsPerBox: 1, notes: "6-count box" },
      { name: "Dozen kraft box",        sizeFor: "dozen",  costPerUnit: "0.95", unitsPerBox: 1, notes: "12-count box" },
      { name: "Double-dozen kraft box", sizeFor: "double", costPerUnit: "1.60", unitsPerBox: 1, notes: "24-count box" },
      { name: "Branded sticker seal",   sizeFor: "all",    costPerUnit: "0.04", unitsPerBox: 1 },
      { name: "Parchment liner",        sizeFor: "all",    costPerUnit: "0.03", unitsPerBox: 1 },
      { name: "Bakers twine",           sizeFor: "all",    costPerUnit: "0.02", unitsPerBox: 1, notes: "per box wrap" },
      { name: "Thank-you card",         sizeFor: "all",    costPerUnit: "0.08", unitsPerBox: 1 },
    ])
    .onConflictDoNothing();

  console.log("✅ Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
