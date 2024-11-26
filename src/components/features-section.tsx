import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, Globe, MessageSquare, Palette, BarChart } from 'lucide-react'

const features = [
  {
    title: 'Easy Integration',
    description: 'Add to your website with a single JavaScript snippet.',
    icon: Code,
  },
  {
    title: 'Multilingual Support',
    description: 'Engage customers in their preferred language.',
    icon: Globe,
  },
  {
    title: 'AI-Powered Conversations',
    description: 'Smart responses powered by advanced AI models.',
    icon: MessageSquare,
  },
  {
    title: 'Customizable Look and Feel',
    description: 'Tailor colors, themes, and messages to your brand.',
    icon: Palette,
  },
  {
    title: 'Real-Time Analytics',
    description: 'Track queries, interactions, and unresolved tickets.',
    icon: BarChart,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="w-10 h-10 text-blue-500 mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

