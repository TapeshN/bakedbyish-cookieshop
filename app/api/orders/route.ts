import { NextRequest, NextResponse } from "next/server";
import { db, orders, orderItems } from "@/db";

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

    // Insert order
    const [order] = await db
      .insert(orders)
      .values({
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

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
