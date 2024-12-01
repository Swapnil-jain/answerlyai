import { Button } from './ui/button'

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">No credit card required to start</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h3 className="text-2xl font-bold mb-4">Hobbyist</h3>
            <p className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li>✓ 1 Chatbot</li>
              <li>✓ Basic Analytics</li>
              <li>✓ Standard Support</li>
              <li>✓ Basic Customization</li>
            </ul>
            <Button className="w-full">Get Started</Button>
          </div>

          {/* Business Tier */}
          <div className="bg-blue-50 p-8 rounded-lg shadow-sm border border-blue-200">
            <h3 className="text-2xl font-bold mb-4">Enthusiast</h3>
            <p className="text-4xl font-bold mb-6">$19.90<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li>✓ Unlimited Chatbots</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Priority Support</li>
              <li>✓ Full Customization</li>
              <li>✓ API Access</li>
            </ul>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Subscribe Now</Button>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <p className="text-2xl font-bold mb-6">Custom Pricing</p>
            <ul className="space-y-4 mb-8">
              <li>✓ Everything in Business</li>
              <li>✓ Dedicated Support</li>
              <li>✓ Custom Integrations</li>
              <li>✓ SLA Agreement</li>
              <li>✓ Advanced Security</li>
            </ul>
            <Button className="w-full">Contact Sales</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

