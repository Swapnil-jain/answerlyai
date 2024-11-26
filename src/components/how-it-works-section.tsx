import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import React from 'react'

const steps = [
  {
    title: 'Create',
    description: 'Build your bot using the no-code drag-and-drop interface.',
  },
  {
    title: 'Integrate',
    description: 'Add it to your website with one line of code.',
  },
  {
    title: 'Automate',
    description: 'Watch it handle queries and boost customer satisfaction.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.title}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{step.description}</CardDescription>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden md:block">
                  <ArrowRight className="w-8 h-8 text-blue-500" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

