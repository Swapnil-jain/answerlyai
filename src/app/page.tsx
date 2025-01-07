import Header from '@/components/header'
import HeroSection from '@/components/hero-section'
import dynamic from 'next/dynamic'

// Statically import critical above-the-fold components
import DemoSection from '@/components/demo-section'

// Lazy load below-the-fold components
const HowItWorksSection = dynamic(() => import('@/components/how-it-works-section'), {
  loading: () => <div className="h-[600px] animate-pulse bg-gray-50" />
})
const FeaturesSection = dynamic(() => import('@/components/features-section'))
const ScenariosSection = dynamic(() => import('@/components/scenarios-section'))
const PricingSection = dynamic(() => import('@/components/pricing-section'))
const ContactSection = dynamic(() => import('@/components/contact-section'))
const Footer = dynamic(() => import('@/components/footer'))
const ChatWidget = dynamic(() => import('@/components/ChatWidget'))

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-16">
      <Header />
      <div className="w-full">
        <HeroSection />  
        <DemoSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ScenariosSection />
        <PricingSection />
        <ContactSection />
      </div>
      <Footer />
      <ChatWidget />
    </main>
  )
}
