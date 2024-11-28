import { Button } from '@/components/ui/button'

export default function DemoSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">See AnswerlyAI in Action</h2>
        <div className="aspect-video max-w-3xl mx-auto bg-gray-200 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">Demo Video Placeholder</p>
        </div>
        <Button size="lg" className="mt-8">Request a Live Demo</Button>
      </div>
    </section>
  )
}

