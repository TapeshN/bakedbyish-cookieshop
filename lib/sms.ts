import twilio from "twilio";

const SID    = process.env.TWILIO_ACCOUNT_SID;
const TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM   = process.env.TWILIO_FROM_NUMBER;
const VENMO  = process.env.VENMO_HANDLE  ?? "@bakedbyish";
const SHOP   = process.env.SHOP_NAME     ?? "Baked by Ish";

const client = SID && TOKEN ? twilio(SID, TOKEN) : null;

/**
 * Normalize phone to E.164 format for Twilio.
 * Accepts: "5125551234", "(512) 555-1234", "+15125551234"
 */
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

export async function sendSMS(to: string | null | undefined, body: string): Promise<boolean> {
  if (!client) {
    console.log("[SMS] Skipped (Twilio not configured):", body);
    return false;
  }
  const phone = normalizePhone(to);
  if (!phone) {
    console.warn("[SMS] Invalid phone, skipped:", to);
    return false;
  }
  try {
    await client.messages.create({ from: FROM!, to: phone, body });
    return true;
  } catch (err) {
    console.error("[SMS] Failed:", err);
    return false;
  }
}

/**
 * Templated messages per order status transition.
 */
export const SMS_TEMPLATES = {
  pending: (name: string, orderId: number, total: number) =>
    `Hi ${name}! 🍪 We got your ${SHOP} order #${orderId} for $${total.toFixed(2)}. ` +
    `Ish will confirm shortly and send Venmo details. No payment yet — sit tight!`,

  confirmed: (name: string, orderId: number, total: number) =>
    `Hi ${name}! Your ${SHOP} order #${orderId} is confirmed ✨ ` +
    `Please Venmo ${VENMO} $${total.toFixed(2)} with note "Order #${orderId}". ` +
    `Once we see it, your order's locked in for Saturday!`,

  paid: (name: string, orderId: number) =>
    `Got your Venmo! 🤎 Order #${orderId} is fully booked — see you Saturday, ${name}.`,

  ready: (name: string, orderId: number, isPickup: boolean) =>
    isPickup
      ? `Hi ${name}! Your ${SHOP} order #${orderId} is ready for pickup 🍪`
      : `Hi ${name}! Your ${SHOP} order #${orderId} is out for delivery 🚗`,

  delivered: (name: string, orderId: number) =>
    `Thanks for ordering from ${SHOP}, ${name}! Hope you love them 🤎 ` +
    `Tag @bakedbyish on IG so we can see your cookies!`,

  cancelled: (name: string, orderId: number) =>
    `Hi ${name}, your ${SHOP} order #${orderId} was cancelled. ` +
    `Reach out if this was a mistake!`,
} as const;

export type SMSStatus = keyof typeof SMS_TEMPLATES;
