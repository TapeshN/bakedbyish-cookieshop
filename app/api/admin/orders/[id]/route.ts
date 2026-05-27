import { NextRequest, NextResponse } from "next/server";
import { db, orders } from "@/db";
import { eq } from "drizzle-orm";
import { sendSMS, SMS_TEMPLATES, type SMSStatus } from "@/lib/sms";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  const valid = ["pending", "confirmed", "paid", "ready", "delivered", "cancelled"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, Number(id)));

  // Fetch order for SMS
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, Number(id)))
    .limit(1);

  if (order && order.customerPhone && status in SMS_TEMPLATES) {
    const name = order.customerName ?? "there";
    const total = Number(order.total);
    let body: string;
    switch (status as SMSStatus) {
      case "confirmed":
        body = SMS_TEMPLATES.confirmed(name, order.id, total);
        break;
      case "paid":
        body = SMS_TEMPLATES.paid(name, order.id);
        break;
      case "ready":
        body = SMS_TEMPLATES.ready(name, order.id, order.deliveryMode === "pickup");
        break;
      case "delivered":
        body = SMS_TEMPLATES.delivered(name, order.id);
        break;
      case "cancelled":
        body = SMS_TEMPLATES.cancelled(name, order.id);
        break;
      default:
        body = "";
    }
    if (body) {
      // Fire-and-forget — don't block the response on Twilio
      sendSMS(order.customerPhone, body).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true });
}
