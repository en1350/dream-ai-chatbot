import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import LearnBar from "@/components/landing/LearnBar";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import AuthSection from "@/components/landing/AuthSection";
import Footer from "@/components/landing/Footer";
import SupportChat from "@/components/landing/SupportChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-ink text-white antialiased selection:bg-electric/40">
      <Navbar />
      {/* Полоса кнопок обучения сразу под фиксированной верхней панелью (h-16 = 64px) */}
      <div className="pt-16">
        <LearnBar />
      </div>
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
        <AuthSection />
      </main>
      <Footer />
      <SupportChat />
    </div>
  );
};

export default Index;