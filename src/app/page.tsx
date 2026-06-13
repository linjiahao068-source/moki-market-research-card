import { Footer } from '@/components/landing/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarketAnxietySection } from '@/components/landing/MarketAnxietySection';
import { MethodBoundarySection } from '@/components/landing/MethodBoundarySection';
import { Navbar } from '@/components/landing/Navbar';
import { PainPointSection } from '@/components/landing/PainPointSection';
import { SampleCardsSection } from '@/components/landing/SampleCardsSection';
import { TickerSubmitSection } from '@/components/landing/TickerSubmitSection';
import { WaitlistSection } from '@/components/landing/WaitlistSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PainPointSection />
      <MarketAnxietySection />
      <SampleCardsSection />
      <TickerSubmitSection />
      <MethodBoundarySection />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
