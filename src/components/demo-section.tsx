'use client'
import { Button } from '@/components/ui/button'
import { Play, MessageSquare, Bot, Users, ArrowRight, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { useRef, useState } from 'react'
import Link from 'next/link'

export default function DemoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play();
        setIsMuted(false);
        videoRef.current.muted = false;
      } else {
        videoRef.current.pause();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section id="demo" className="w-full py-20 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="container mx-auto px-6 2xl:max-w-[1600px]">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Live Demo</span>
          </div>
          <h2 className="text-4xl font-bold mb-6">Experience the Magic</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Imagine your competitors still making customers wait while your AI handles 
            hundreds of conversations simultaneously - This is the future of customer 
            interaction.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-12 items-center">
          {/* Demo Video/Preview */}
          <div className="relative">
            <div className="relative rounded-3xl shadow-xl overflow-hidden w-[90vw] h-[50.625vw] sm:w-[75vw] sm:h-[42.1875vw] md:w-[65vw] md:h-[36.5625vw] lg:w-[45vw] lg:h-[25.3125vw] xl:w-[45vw] xl:h-[25.3125vw] 2xl:w-[50vw] 2xl:h-[28.125vw] mx-auto">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                src="/tutorial.mp4"
                loop
                playsInline
                muted={isMuted}
                onClick={togglePlay}
              />
              {!isPlaying && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative group cursor-pointer" onClick={togglePlay}>
                      <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-200"></div>
                      <Button 
                        size="lg"
                        className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                      >
                        <Play className="h-6 w-6 ml-1" />
                      </Button>
                    </div>
                  </div>
                  {/* Demo Preview Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900 to-transparent p-6">
                    <p className="text-white text-lg font-medium">
                      Watch AnswerlyAI in Action
                    </p>
                    <p className="text-gray-300 text-sm">
                      2 minutes demo of our key features
                    </p>
                  </div>
                </>
              )}
              {isPlaying && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex items-center justify-between p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={togglePlay}
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={toggleMute}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={toggleFullscreen}
                      >
                        <Maximize2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features Highlight */}
          <div className="space-y-8 max-w-lg mx-auto lg:mx-0">
            <div className="grid gap-6">
              {/* Feature 1 */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Smart Conversations</h3>
                  <p className="text-gray-600">
                    Your customers won't believe they're talking to an AI. Experience human-like 
                    conversations that build trust and loyalty.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Multiple Chat Styles</h3>
                  <p className="text-gray-600">See different conversation flows in action - from simple FAQs to complex multi-step interactions.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Customer Satisfaction</h3>
                  <p className="text-gray-600">Experience how our chatbot handles customer queries efficiently, leading to higher satisfaction rates.</p>
                </div>
              </div>
            </div>

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
