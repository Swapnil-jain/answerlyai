import { Button } from '@/components/ui/button'
import { ArrowRight, Code2, BarChart3, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function DemoSection() {
  return (
    <section id="demo" className="w-full py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Visual Workflow Builder</h2>
          <p className="text-xl text-gray-600">Create complex AI Agent flows with our intuitive, industry leading drag-and-drop interface.</p>
        </div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-12 items-center">
          {/* Demo Image - Made larger and shifted left */}
          <div className="relative">
            <div className="max-w-[1200px] 2xl:max-w-[1400px]">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/main.png"
                  alt="AnswerlyAI Workflow Builder Demo"
                  width={1200}
                  height={800}
                  className="w-full"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  quality={75}
                />
              </div>
            </div>
          </div>

          {/* Features Highlight - Kept on right side */}
          <div className="w-full space-y-6">
            <div className="grid gap-6">
              {/* Feature blocks remain the same */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-blue-50 p-3 rounded-lg shrink-0">
                  <Code2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">Zero Code Required</h3>
                  <p className="text-gray-600">
                    No technical knowledge needed. We handle all the complexities behind the scenes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-purple-50 p-3 rounded-lg shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">Real-Time Analytics</h3>
                  <p className="text-gray-600">
                    Track interactions and satisfaction rates instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-green-50 p-3 rounded-lg shrink-0">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">Intuitive Interface</h3>
                  <p className="text-gray-600">
                    Clean and simple design. Everything you need, right where you expect it.
                  </p>
                </div>
              </div>
            </div>

            {/* Try Now button */}
            <div className="flex justify-center pt-4">
              <Link href="/mobile-notice" className="sm:hidden w-full">
                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/builder" className="hidden sm:block">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}