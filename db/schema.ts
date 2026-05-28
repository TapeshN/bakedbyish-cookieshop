import {
  pgTable, serial, text, numeric, integer, boolean,
  timestamp, date, pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────
export const orderStatusEnum = pgEnum("order_status", [
  "pending", "confirmed", "paid", "ready", "delivered", "cancelled",
]);
export const batchStatusEnum = pgEnum("batch_status", [
  "planning", "shopping", "baking", "complete", "cancelled",
]);
export const deliveryModeEnum = pgEnum("delivery_mode", ["pickup", "delivery"]);
export const boxSizeEnum = pgEnum("box_size", ["half", "dozen", "double"]);
export const capexCategoryEnum = pgEnum("capex_category", [
  "equipment", "supplies", "fees", "marketing", "other",
]);
export const packagingSizeEnum = pgEnum("packaging_size", [
  "half", "dozen", "double", "all",
]);
export const stockTxnReasonEnum = pgEnum("stock_txn_reason", [
  "restock",         // bought more (delta > 0, optional totalCost)
  "batch_consumed",  // a batch went to "complete" and ate ingredients (delta < 0, batchId set)
  "manual_adjust",   // Ish edited the stock value directly
  "initial",         // first time stock was set
  "waste",           // spoiled/wasted/dropped on the floor
]);

// ── Ingredient catalog ─────────────────────────────────────────────────────
export const ingredients = pgTable("ingredients", {
  id:                 serial("id").primaryKey(),
  name:               text("name").notNull(),
  unit:               text("unit").notNull(),          // g | ml | tbsp | cup | each | oz | stick
  costPerUnit:        numeric("cost_per_unit", { precision: 10, scale: 4 }).notNull(),
  currentStock:       numeric("current_stock",         { precision: 10, scale: 4 }).default("0"),
  lowStockThreshold:  numeric("low_stock_threshold",   { precision: 10, scale: 4 }).default("0"),
  lastRestockedAt:    timestamp("last_restocked_at"),
  notes:              text("notes"),
  updatedAt:          timestamp("updated_at").defaultNow(),
});

// ── Cookie / recipe definitions ────────────────────────────────────────────
export const cookies = pgTable("cookies", {
  id:         serial("id").primaryKey(),
  slug:       text("slug").notNull().unique(),
  name:       text("name").notNull(),
  blurb:      text("blurb"),
  salePrice:  numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  active:     boolean("active").default(true),
  tags:       text("tags").array(),
  accent:     text("accent"),
  photo:      text("photo"),
  createdAt:  timestamp("created_at").defaultNow(),
});

// ── Recipe ingredients (how much of each ingredient per single cookie) ─────
export const recipeIngredients = pgTable("recipe_ingredients", {
  id:           serial("id").primaryKey(),
  cookieId:     integer("cookie_id").notNull().references(() => cookies.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  quantity:     numeric("quantity", { precision: 10, scale: 4 }).notNull(),
  notes:        text("notes"),  // "browned", "chopped", etc.
});

// ── Weekly batches ─────────────────────────────────────────────────────────
export const weeklyBatches = pgTable("weekly_batches", {
  id:        serial("id").primaryKey(),
  weekOf:    date("week_of").notNull(),   // the Saturday delivery date
  status:    batchStatusEnum("status").default("planning"),
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Cookies planned per batch ──────────────────────────────────────────────
export const batchCookies = pgTable("batch_cookies", {
  id:          serial("id").primaryKey(),
  batchId:     integer("batch_id").notNull().references(() => weeklyBatches.id, { onDelete: "cascade" }),
  cookieId:    integer("cookie_id").notNull().references(() => cookies.id),
  plannedQty:  integer("planned_qty").notNull(),
  actualQty:   integer("actual_qty"),
});

// ── Customer orders ────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id:             serial("id").primaryKey(),
  batchId:        integer("batch_id").references(() => weeklyBatches.id),
  customerName:   text("customer_name"),
  customerPhone:  text("customer_phone"),
  boxSize:        boxSizeEnum("box_size").notNull(),
  boxCount:       integer("box_count").notNull(),
  deliveryMode:   deliveryModeEnum("delivery_mode").notNull(),
  pickupSlot:     text("pickup_slot"),   // "sat" | "sat-mid" | "sat-late"
  note:           text("note"),
  subtotal:       numeric("subtotal",      { precision: 10, scale: 2 }).notNull(),
  discount:       numeric("discount",      { precision: 10, scale: 2 }).default("0"),
  deliveryFee:    numeric("delivery_fee",  { precision: 10, scale: 2 }).default("0"),
  total:          numeric("total",         { precision: 10, scale: 2 }).notNull(),
  status:         orderStatusEnum("status").default("pending"),
  createdAt:      timestamp("created_at").defaultNow(),
});

// ── Order line items ───────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id:          serial("id").primaryKey(),
  orderId:     integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  cookieSlug:  text("cookie_slug").notNull(),   // denormalized — survives recipe edits
  cookieName:  text("cookie_name").notNull(),
  quantity:    integer("quantity").notNull(),
  unitPrice:   numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// ── Packaging catalog (boxes, bags, stickers, twine, etc.) ─────────────────
export const packaging = pgTable("packaging", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),                          // "Kraft dozen box"
  sizeFor:     packagingSizeEnum("size_for").notNull(),         // which box size uses this
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 4 }).notNull(),
  unitsPerBox: integer("units_per_box").default(1),             // e.g. 1 box, 1 sticker per box, 4 inches of twine
  notes:       text("notes"),
  updatedAt:   timestamp("updated_at").defaultNow(),
});

// ── Stock transaction log (audit trail for every stock change) ────────────
export const stockTransactions = pgTable("stock_transactions", {
  id:           serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  delta:        numeric("delta",         { precision: 10, scale: 4 }).notNull(),  // signed
  balanceAfter: numeric("balance_after", { precision: 10, scale: 4 }).notNull(),
  reason:       stockTxnReasonEnum("reason").notNull(),
  batchId:      integer("batch_id").references(() => weeklyBatches.id, { onDelete: "set null" }),
  totalCost:    numeric("total_cost", { precision: 10, scale: 2 }),  // for restocks: what Ish paid
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow(),
});

// ── Capital expenses (one-time investments: equipment, fees, etc.) ─────────
export const capitalExpenses = pgTable("capital_expenses", {
  id:               serial("id").primaryKey(),
  name:             text("name").notNull(),                     // "KitchenAid Pro 600"
  category:         capexCategoryEnum("category").notNull(),
  amount:           numeric("amount", { precision: 10, scale: 2 }).notNull(),
  purchasedAt:      date("purchased_at").notNull(),
  usefulLifeMonths: integer("useful_life_months").default(60),  // null = doesn't amortize
  notes:            text("notes"),
  createdAt:        timestamp("created_at").defaultNow(),
});
