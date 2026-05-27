"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import OrderBuilder from "@/components/OrderBuilder";
import StorySection from "@/components/StorySection";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);

  function scrollToOrder() {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Nav onOrder={scrollToOrder} />
      <Hero onOrder={scrollToOrder} />
      <div className="scallop" style={{ maxWidth: 1240, margin: "0 auto" }} />
      <MenuSection onAdd={(id) => setPendingAdd(id)} />
      <OrderBuilder
        initialAdd={pendingAdd}
        onConsumed={() => setPendingAdd(null)}
      />
      <StorySection />
      <ReviewsSection />
      <Footer />
    </>
  );
}
