"use client";

import { useState } from "react";
import { getOrderStatus } from "@/data/orderConfig";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import OrderBuilder from "@/components/OrderBuilder";
import OrderClosed from "@/components/OrderClosed";
import StorySection from "@/components/StorySection";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);
  const isOpen = getOrderStatus() === "open";

  function scrollToOrder() {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Nav onOrder={scrollToOrder} />
      <Hero onOrder={scrollToOrder} />
      <div className="scallop" style={{ maxWidth: 1240, margin: "0 auto" }} />
      <MenuSection onAdd={(id) => {
        if (isOpen) {
          setPendingAdd(id);
          scrollToOrder();
        } else {
          scrollToOrder();
        }
      }} />
      {isOpen ? (
        <OrderBuilder
          initialAdd={pendingAdd}
          onConsumed={() => setPendingAdd(null)}
        />
      ) : (
        <OrderClosed />
      )}
      <StorySection />
      <ReviewsSection />
      <Footer />
    </>
  );
}
