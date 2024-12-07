import { Button } from '@/components/ui/button'
import { ArrowRight, Bot, Zap, MousePointer2 } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="w-full min-h-[80vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-left sm:text-left space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <div className="inline-flex items-center justify-center">
                <span className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Only.Relevant.Features.</span>
                </span>
              </div>
              <div className="inline-flex items-center justify-center">
                <span className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                  <MousePointer2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600 whitespace-nowrap">No-Code Required</span>
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-center sm:text-left">
              The Simplest Chatbot Maker On The Planet,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                Because your time matters
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-xl text-center sm:text-left">
              Create powerful AI chatbots as easily as chatting with a friend. 
              Just drag, drop, and describe – no coding needed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-fit mx-auto sm:mx-0">
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">Drag & Drop Builder</span>
              </div>
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">Natural Language Setup</span>
              </div>
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">Visual Flow Designer</span>
              </div>
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">One-Click Website Import</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/mobile-notice" className="sm:hidden w-full">
                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/builder" className="hidden sm:block">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-gray-500 flex items-center gap-2 h-[52px]">
                <span className="bg-green-100 p-1 rounded-full">
                  <Zap className="w-4 h-4 text-green-600" />
                </span>
                So simple you will fall in love.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-8 border-t">
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-gray-900">24/7</h4>
                <p className="text-xs sm:text-sm text-gray-600">Always Available</p>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-gray-900">90%</h4>
                <p className="text-xs sm:text-sm text-gray-600">Query Resolution</p>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-gray-900">Upto 98%</h4>
                <p className="text-xs sm:text-sm text-gray-600">Cost Reduction</p>
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
