import Hero from "./landing/Hero";
import TrustSection from "./landing/TrustSection";
import RarityCards from "./landing/RarityCards";
import HowItWorks from "./landing/HowItWorks";
import TransparencySection from "./landing/TransparencySection";
import Footer from "./landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white selection:bg-primary/20 selection:text-primary-dark">
      <Hero />
      <TrustSection />
      <RarityCards />
      <HowItWorks />
      <TransparencySection />
      <Footer />
    </main>
  );
}
