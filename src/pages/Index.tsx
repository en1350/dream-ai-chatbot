import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import WisdomMinute from "@/components/landing/WisdomMinute";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import AuthSection from "@/components/landing/AuthSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-ink text-white antialiased selection:bg-electric/40">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <WisdomMinute />
        <Pricing />
        <Faq />
        <AuthSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;