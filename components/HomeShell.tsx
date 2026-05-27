"use client";

import { useState } from "react";
import MenuSection from "@/components/MenuSection";
import OrderBuilder from "@/components/OrderBuilder";
import OrderClosed from "@/components/OrderClosed";
import type { BatchAvailability } from "@/lib/batch";
import type { OrderStatus } from "@/data/orderConfig";

export default function HomeShell({
  isOpen,
  availability,
  windowStatus,
}: {
  isOpen: boolean;
  availability: BatchAvailability;
  windowStatus: OrderStatus;
}) {
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);

  function scrollToOrder() {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  }

  // Reason for closing: sold out OR window
  const reason: "open" | "sold-out" | "window" = isOpen
    ? "open"
    : availability.hasCapacityLimit && availability.fullySoldOut
      ? "sold-out"
      : "window";

  return (
    <>
      <MenuSection
        availability={availability}
        onAdd={(id) => {
          if (isOpen) setPendingAdd(id);
          scrollToOrder();
        }}
      />
      {reason === "open" ? (
        <OrderBuilder
          initialAdd={pendingAdd}
          onConsumed={() => setPendingAdd(null)}
          availability={availability}
        />
      ) : (
        <OrderClosed reason={reason} availability={availability} />
      )}
    </>
  );
}
