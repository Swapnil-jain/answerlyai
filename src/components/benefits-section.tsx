import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Smile, TrendingUp } from 'lucide-react'

const benefits = [
  {
    title: 'Save Time and Costs',
    description: 'Automate repetitive queries and reduce support workload.',
    icon: Clock,
  },
  {
    title: 'Improve Customer Experience',
    description: 'Provide instant, accurate responses 24/7.',
    icon: Smile,
  },
  {
    title: 'Grow Your Business',
    description: 'Focus on scaling while the bot handles support.',
    icon: TrendingUp,
  },
]

export default function BenefitsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SmartBotify?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardHeader>
                <benefit.icon className="w-10 h-10 text-blue-500 mb-2" />
                <CardTitle>{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{benefit.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold mb-4">What Our Customers Say</h3>
          <blockquote className="italic text-gray-600">
            "SmartBotify has transformed our customer support. We've seen a 40% reduction in response times and our team can now focus on complex issues."
          </blockquote>
          <p className="mt-2 font-semibold">- Jane Doe, CEO of TechCorp</p>
        </div>
      </div>
    </section>
  )
}

