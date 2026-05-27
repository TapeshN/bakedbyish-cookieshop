import { NextRequest, NextResponse } from "next/server";
import { db, orders, orderItems } from "@/db";
import { sendSMS, SMS_TEMPLATES } from "@/lib/sms";
import { getBatchAvailability } from "@/lib/batch";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      boxSize,
      boxCount,
      deliveryMode,
      pickupSlot,
      note,
      subtotal,
      discount,
      deliveryFee,
      total,
      items, // [{ cookieSlug, cookieName, quantity, unitPrice }]
    } = body;

    // ── Capacity check ────────────────────────────────────────────────────
    // If an active batch exists with capacity tracking, re-verify each item
    // server-side so a stale client can't oversell.
    const availability = await getBatchAvailability();
    if (availability.hasCapacityLimit) {
      const availBySlug: Record<string, number> = {};
      for (const c of availability.cookies) availBySlug[c.slug] = c.remaining;

      for (const item of items ?? []) {
        const remaining = availBySlug[item.cookieSlug];
        if (remaining === undefined) {
          return NextResponse.json(
            { error: `Sorry — "${item.cookieName}" isn't on this week's menu.` },
            { status: 409 }
          );
        }
        if (item.quantity > remaining) {
          return NextResponse.json(
            {
              error: `Only ${remaining} ${item.cookieName} left — please adjust your box.`,
              soldOut: item.cookieSlug,
              remaining,
            },
            { status: 409 }
          );
        }
      }
    }

    // Insert order (auto-attach to active batch if any)
    const [order] = await db
      .insert(orders)
      .values({
        batchId:       availability.batchId ?? null,
        customerName:  customerName ?? null,
        customerPhone: customerPhone ?? null,
        boxSize,
        boxCount,
        deliveryMode,
        pickupSlot:    pickupSlot ?? null,
        note:          note ?? null,
        subtotal:      String(subtotal),
        discount:      String(discount ?? 0),
        deliveryFee:   String(deliveryFee ?? 0),
        total:         String(total),
        status:        "pending",
      })
      .returning({ id: orders.id });

    // Insert line items
    if (items?.length) {
      await db.insert(orderItems).values(
        items.map((item: { cookieSlug: string; cookieName: string; quantity: number; unitPrice: number }) => ({
          orderId:    order.id,
          cookieSlug: item.cookieSlug,
          cookieName: item.cookieName,
          quantity:   item.quantity,
          unitPrice:  String(item.unitPrice),
        }))
      );
    }

    // Auto-SMS: "we got your order" — fire and forget
    if (customerPhone) {
      const name = customerName ?? "there";
      sendSMS(customerPhone, SMS_TEMPLATES.pending(name, order.id, Number(total))).catch(console.error);
    }

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
