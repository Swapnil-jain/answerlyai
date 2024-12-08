import Header from '@/components/header'
import HeroSection from '@/components/hero-section'
import FeaturesSection from '@/components/features-section'
import WorkflowEditorSection from '@/components/workflow-editor-section'
import WorkflowDemoSection from '@/components/workflow-demo-section'
import DemoSection from '@/components/demo-section'
import PricingSection from '@/components/pricing-section'
import ContactSection from '@/components/contact-section'
import Footer from '@/components/footer'
import ChatWidget from '@/components/ChatWidget'
import ScenariosSection from '@/components/scenarios-section'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-16">
      <Header />
      <div className="w-full">
        <HeroSection />
        <WorkflowDemoSection />
        <WorkflowEditorSection />
        <DemoSection />
        <ScenariosSection />
        <FeaturesSection />
        <PricingSection />
        <ContactSection />
      </div>
      <Footer />
      <ChatWidget />
    </main>
  )
}
