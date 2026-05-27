/**
 * Seed script — run once after `npx drizzle-kit push` to populate
 * the cookies and a starter set of ingredients.
 *
 * Usage:
 *   npx tsx db/seed.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, cookies, ingredients } from "./index";

async function main() {
  console.log("🍪 Seeding cookies…");

  await db
    .insert(cookies)
    .values([
      {
        slug:      "brown-butter",
        name:      "Brown Butter White Chip",
        blurb:     "Brown-buttered dough with white chocolate puddles and soft caramel.",
        salePrice: "4.00",
        active:    true,
        tags:      ["bestseller"],
        accent:    "var(--chocolate)",
        photo:     "/cookies/hero-stack.png",
      },
      {
        slug:      "snickerdoodle",
        name:      "Cinnamon Snickerdoodle",
        blurb:     "Cracked top, soft middle, rolled in vanilla-cinnamon sugar.",
        salePrice: "4.00",
        active:    true,
        tags:      ["classic"],
        accent:    "var(--caramel)",
        photo:     "/cookies/snickerdoodles.png",
      },
      {
        slug:      "oatmeal",
        name:      "Coconut Oatmeal",
        blurb:     "Chewy oat cookie kissed with toasted coconut and brown sugar.",
        salePrice: "4.00",
        active:    true,
        tags:      ["fan favorite"],
        accent:    "var(--caramel)",
        photo:     "/cookies/oatmeal-plate.png",
      },
      {
        slug:      "tahini",
        name:      "Tahini Dark Chocolate",
        blurb:     "Toasted sesame + 70% dark chocolate puddles. Flaky salt finish.",
        salePrice: "5.00",
        active:    true,
        tags:      ["new"],
        accent:    "var(--ink)",
      },
      {
        slug:      "funfetti",
        name:      "Birthday Funfetti",
        blurb:     "Vanilla bean sugar cookie loaded with rainbow sprinkles.",
        salePrice: "4.00",
        active:    true,
        tags:      [],
        accent:    "var(--strawberry)",
      },
      {
        slug:      "smores",
        name:      "Campfire S'mores",
        blurb:     "Graham crust, milk chocolate, toasted marshmallow center.",
        salePrice: "5.00",
        active:    true,
        tags:      ["seasonal"],
        accent:    "var(--chocolate)",
      },
      {
        slug:      "lemon",
        name:      "Lemon Poppyseed Glaze",
        blurb:     "Bright Meyer lemon, poppyseed crunch, sugar-snow glaze.",
        salePrice: "4.00",
        active:    true,
        tags:      [],
        accent:    "var(--caramel)",
      },
      {
        slug:      "red-velvet",
        name:      "Red Velvet White Chip",
        blurb:     "Cocoa-kissed, cream-cheese drizzle, white chocolate chunks.",
        salePrice: "5.00",
        active:    true,
        tags:      [],
        accent:    "var(--strawberry)",
      },
    ])
    .onConflictDoNothing();

  console.log("🧂 Seeding ingredients…");

  await db
    .insert(ingredients)
    .values([
      { name: "All-purpose flour",   unit: "g",    costPerUnit: "0.0022" },
      { name: "Unsalted butter",     unit: "g",    costPerUnit: "0.0110" },
      { name: "Granulated sugar",    unit: "g",    costPerUnit: "0.0018" },
      { name: "Brown sugar",         unit: "g",    costPerUnit: "0.0022" },
      { name: "Eggs",                unit: "each", costPerUnit: "0.3500" },
      { name: "Vanilla extract",     unit: "tsp",  costPerUnit: "0.1500" },
      { name: "Baking soda",         unit: "g",    costPerUnit: "0.0030" },
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

  console.log("✅ Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
