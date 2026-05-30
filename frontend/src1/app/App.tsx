import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { MarqueeSection } from "./components/MarqueeSection";
import { StatsSection } from "./components/StatsSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { CtaSection } from "./components/CtaSection";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", color: "#0d1a14", overflowX: "hidden" }}>
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <StatsSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
