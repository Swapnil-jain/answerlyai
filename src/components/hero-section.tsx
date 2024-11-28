import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="w-full pt-32 pb-16 bg-white">
      <div className="container mx-auto px-4 text-center max-w-4xl">
        <h1 className="text-5xl font-bold tracking-tight mb-6 sm:text-6xl">
          Engage More Visitors. Only pay for results
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI chatbot widget helping you convert visitors into paying users. Without expensive monthly subscriptions. Pay-per-message only!
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8">
            Pre-launch special: 70% off
          </Button>
          <Button size="lg" variant="outline" className="px-8">
            Join waitlist
          </Button>
        </div>
        <div className="mt-16">
          <Image
            src="/placeholder.svg?height=600&width=1000"
            alt="AnswerlyAI Dashboard"
            width={1000}
            height={600}
            className="rounded-xl shadow-2xl border border-gray-200"
          />
        </div>
      </div>
    </section>
  )
}

