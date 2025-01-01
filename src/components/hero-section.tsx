import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, MousePointer2 } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="w-full min-h-[70vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-[391px]:px-1">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
          <div className="text-left sm:text-left space-y-6 lg:space-y-8">
            <div className="flex flex-row gap-3 justify-center sm:justify-start">
              <div className="inline-flex items-center justify-center">
                <span className="inline-flex items-center gap-2 bg-[#e6eeff] px-4 py-2 rounded-full">
                  <span className="text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">Only.Relevant.Features.</span>
                </span>
              </div>
              <div className="inline-flex items-center justify-center">
                <span className="inline-flex items-center gap-2 bg-[#e6f5ea] px-4 py-2 rounded-full">
                  <MousePointer2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs sm:text-sm font-medium text-green-600 whitespace-nowrap">No-Code Required</span>
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight text-center sm:text-left">
              The Simplest AI Agent Maker
              <br className="sm:hidden" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                On The Planet
              </span>
            </h1>
            
            <div className="space-y-2 max-[391px]:px-2">
              <p className="text-lg sm:text-xl text-gray-500 max-w-xl text-center sm:text-left">
                Create a no-code AI Agent to automate customer support, answer questions, engage users, schedule meetings and more.
              </p>
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
          </div>

          <div className="relative block mt-8 lg:mt-0">
            <div className="relative rounded-3xl shadow-xl overflow-hidden w-[90vw] h-[50.625vw] sm:w-[70vw] sm:h-[39.375vw] md:w-[60vw] md:h-[33.75vw] lg:w-[40vw] lg:h-[22.5vw] xl:w-[40vw] xl:h-[22.5vw] 2xl:w-[45vw] 2xl:h-[25.3125vw] mx-auto">
              <video 
                className="w-full h-full aspect-video"
                autoPlay
                loop
                playsInline
                controls
                controlsList="nodownload"
                muted
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
