import { Button } from '@/components/ui/button'
import { ArrowRight, Bot, Zap, MousePointer2 } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="w-full min-h-[80vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 py-12 max-[391px]:px-1">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
          <div className="text-left sm:text-left space-y-6 lg:space-y-8">
            <div className="flex flex-row gap-3 justify-center sm:justify-start">
              <div className="inline-flex items-center justify-center">
                <span className="inline-flex items-center gap-2 bg-[#e6eeff] px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Only.Relevant.Features.</span>
                </span>
              </div>
              <div className="inline-flex items-center justify-center">
                <span className="inline-flex items-center gap-2 bg-[#e6f5ea] px-4 py-2 rounded-full">
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
              Just drag, drop, and describe – no coding experience needed.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 w-fit mx-auto sm:mx-0 max-[391px]:px-3">
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">Drag & Drop Builder</span>
              </div>
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">One-Click Website Import</span>
              </div>
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">No More Cluttered UIs</span>
              </div>
              <div className="w-fit inline-flex items-center justify-center sm:justify-start gap-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                <span className="text-md text-gray-600">No More Useless Features</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center max-[391px]:px-4">
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

            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-8 border-t max-[391px]:px-5">
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

          <div className="relative block mt-8 lg:mt-0">
            <div className="relative rounded-3xl shadow-xl overflow-hidden w-[90vw] h-[50.625vw] sm:w-[70vw] sm:h-[39.375vw] md:w-[60vw] md:h-[33.75vw] lg:w-[40vw] lg:h-[22.5vw] xl:w-[40vw] xl:h-[22.5vw] 2xl:w-[45vw] 2xl:h-[25.3125vw] mx-auto">
              <video 
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                controls
                controlsList="nodownload"
              >
                <source src="/FinalDemo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
