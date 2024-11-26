import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Pay-per-message',
    description: 'Perfect for businesses of all sizes',
    price: '0.01¢',
    priceDetail: 'per message',
    features: [
      'No monthly fees',
      'Pay only for what you use',
      'Unlimited conversations',
      'Real-time analytics',
      '24/7 support',
      'Custom branding',
    ],
    badge: 'MOST POPULAR',
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for large businesses',
    price: 'Custom',
    priceDetail: 'contact sales',
    features: [
      'Custom AI model training',
      'Dedicated account manager',
      'Premium support SLA',
      'Custom integrations',
      'Volume discounts',
      'API access',
    ],
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Usage-Based Pricing</h2>
          <p className="text-xl text-gray-600">
            No expensive subscriptions. Only pay for successful interactions with your customers.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className="relative">
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {plan.badge}
                </span>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.priceDetail}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">All plans include:</p>
          <div className="flex justify-center gap-8 text-sm">
            <span className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              No credit card required
            </span>
            <span className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              14-day free trial
            </span>
            <span className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

