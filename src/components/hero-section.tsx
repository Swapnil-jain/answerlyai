import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Bot, Zap, MousePointer2 } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="w-full min-h-[90vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Only. Relevant. Features.</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full ml-4">
                <MousePointer2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">No-Code Required</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Your Customer Support,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                Simplified
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-xl">
              Create powerful AI chatbots as easily as chatting with a friend. 
              Just drag, drop, and describe – no coding needed. Transform your 
              customer support into meaningful conversations.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span className="text-sm text-gray-600">Drag & Drop Builder</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span className="text-sm text-gray-600">Natural Language Setup</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span className="text-sm text-gray-600">Visual Flow Designer</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span className="text-sm text-gray-600">One-Click Website Import</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Link href="/builder">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-gray-500 flex items-center gap-2">
                <span className="bg-green-100 p-1 rounded-full">
                  <Zap className="w-4 h-4 text-green-600" />
                </span>
                No credit card required
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t">
              <div>
                <h4 className="text-2xl font-bold text-gray-900">24/7</h4>
                <p className="text-sm text-gray-600">Always Available</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">90%</h4>
                <p className="text-sm text-gray-600">Query Resolution</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">50%</h4>
                <p className="text-sm text-gray-600">Cost Reduction</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent rounded-3xl transform rotate-6"></div>
            <div className="relative bg-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 bg-gray-100 rounded-2xl p-4">
                  <p className="text-gray-600">Hi! I'm your AI assistant. How can I help you today?</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-1 bg-blue-50 rounded-2xl p-4 ml-14">
                  <p className="text-gray-600">I need help with my order status.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 bg-gray-100 rounded-2xl p-4">
                  <p className="text-gray-600">I can help you with that! Could you please provide your order number?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

