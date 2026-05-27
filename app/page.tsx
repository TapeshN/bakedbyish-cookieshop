import { getBatchAvailability } from "@/lib/batch";
import { getOrderStatus } from "@/data/orderConfig";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import StorySection from "@/components/StorySection";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";
import HomeShell from "@/components/HomeShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const availability = await getBatchAvailability();
  const windowStatus = getOrderStatus();

  // Effective open = both window AND capacity say "yes"
  const windowOpen   = windowStatus === "open";
  const capacityOpen = !availability.hasCapacityLimit || !availability.fullySoldOut;
  const isOpen       = windowOpen && capacityOpen;

  return (
    <>
      <Nav />
      <Hero />
      <div className="scallop" style={{ maxWidth: 1240, margin: "0 auto" }} />
      <HomeShell isOpen={isOpen} availability={availability} windowStatus={windowStatus} />
      <StorySection />
      <ReviewsSection />
      <Footer />
    </>
  );
}
