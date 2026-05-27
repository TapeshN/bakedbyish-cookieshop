"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TRANSITIONS: Record<string, string[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready:     ["delivered"],
  delivered: [],
  cancelled: [],
};

const LABELS: Record<string, string> = {
  confirmed: "Confirm",
  ready:     "Mark Ready",
  delivered: "Mark Delivered",
  cancelled: "Cancel",
};

export default function OrderActions({ orderId, currentStatus }: { orderId: number; currentStatus: string }) {
  const router  = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const next = TRANSITIONS[currentStatus] ?? [];

  if (next.length === 0) return null;

  async function updateStatus(status: string) {
    setLoading(status);
    await fetch(`/api/admin/orders/${orderId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    router.refresh();
    setLoading(null);
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {next.map((status) => (
        <button
          key={status}
          onClick={() => updateStatus(status)}
          disabled={!!loading}
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "0.5rem",
            border: status === "cancelled" ? "1.5px solid var(--terracotta)" : "none",
            background: status === "cancelled" ? "transparent" : "var(--ink)",
            color: status === "cancelled" ? "var(--terracotta)" : "var(--paper)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading === status ? "…" : LABELS[status] ?? status}
        </button>
      ))}
    </div>
  );
}
