/**
 * Order window configuration — edit this each week before Ish posts the menu.
 *
 * QUICK TOGGLE:
 *   forceOpen:   true  → orders always open regardless of dates
 *   forceClosed: true  → orders always closed regardless of dates
 *   (both false = automatic, based on openAt / closeAt clock check)
 *
 * DATES: ISO 8601 with timezone offset, e.g. "2026-06-03T12:00:00-05:00"
 *   openAt  — when this week's ordering window opens
 *   closeAt — when ordering closes (e.g. Fri 8pm)
 *
 * NEXT BATCH: optional — if set, the closed state shows a countdown to this date.
 *   Leave as empty string if next week's dates aren't decided yet.
 */

export const ORDER_CONFIG = {
  // ── Manual overrides ───────────────────────────────────────────────────────
  forceOpen: false,
  forceClosed: false,

  // ── This week's window ─────────────────────────────────────────────────────
  openAt:  "2026-05-28T12:00:00-05:00", // Wed noon
  closeAt: "2026-05-30T20:00:00-05:00", // Fri 8pm

  // ── Next batch (shown on the closed screen) ────────────────────────────────
  nextOpenAt: "", // e.g. "2026-06-03T12:00:00-05:00" — leave blank if TBD
} as const;

// ── Derived helpers ─────────────────────────────────────────────────────────

export type OrderStatus = "open" | "upcoming" | "closed";

export function getOrderStatus(now: Date = new Date()): OrderStatus {
  if (ORDER_CONFIG.forceOpen)   return "open";
  if (ORDER_CONFIG.forceClosed) return "closed";

  const open  = new Date(ORDER_CONFIG.openAt);
  const close = new Date(ORDER_CONFIG.closeAt);

  if (now < open)   return "upcoming"; // window hasn't started yet
  if (now <= close) return "open";
  return "closed";
}

export function getNextOpenDate(): Date | null {
  if (!ORDER_CONFIG.nextOpenAt) return null;
  return new Date(ORDER_CONFIG.nextOpenAt);
}

export function getOpenDate(): Date {
  return new Date(ORDER_CONFIG.openAt);
}

export function getCloseDate(): Date {
  return new Date(ORDER_CONFIG.closeAt);
}
