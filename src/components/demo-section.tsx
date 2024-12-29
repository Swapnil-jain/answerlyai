'use client'
import { Button } from '@/components/ui/button'
import { Play, ArrowRight, Pause, Volume2, VolumeX, Maximize2, Code2, BarChart3, Sparkles } from 'lucide-react'
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
      <div className="container mx-auto px-6">
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

        <div className="grid lg:grid-cols-[1.5fr,1fr] gap-12 items-center max-w-[1400px] mx-auto">
          {/* Demo Video/Preview */}
          <div className="relative w-full max-w-4xl mx-auto lg:mx-0">
            <div className="relative rounded-3xl shadow-xl overflow-hidden aspect-video w-full">
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
          <div className="w-full space-y-6">
            <div className="grid gap-6">
              {/* No Code Required */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-blue-50 p-3 rounded-lg shrink-0">
                  <Code2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">Zero Code Required</h3>
                  <p className="text-gray-600">
                    No technical knowledge needed. We handle all the complexities behind the scenes. Deploy in minutes.
                  </p>
                </div>
              </div>

              {/* Real-time Analytics */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="bg-purple-50 p-3 rounded-lg shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg">Real-Time Analytics</h3>
                  <p className="text-gray-600">
                    Track interactions and satisfaction rates instantly. Identify improvements in real-time.
                  </p>
                </div>
              </div>

              {/* Simple UI */}
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
