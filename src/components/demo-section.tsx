import { Button } from '@/components/ui/button'
import { Play, MessageSquare, Bot, Users, ArrowRight } from 'lucide-react'

export default function DemoSection() {
  return (
    <section id="demo" className="w-full py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Live Demo</span>
          </div>
          <h2 className="text-4xl font-bold mb-6">Experience the Magic</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how AnswerlyAI transforms customer interactions into meaningful conversations.
            Try our demo to experience the simplicity and power firsthand.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo Video/Preview */}
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative group cursor-pointer">
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
            </div>
          </div>

          {/* Features Highlight */}
          <div className="space-y-8">
            <div className="grid gap-6">
              {/* Feature 1 */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Conversations</h3>
                  <p className="text-gray-600">
                    Watch how our AI understands context and provides relevant responses,
                    just like a human customer service agent.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Multiple Chat Styles</h3>
                  <p className="text-gray-600">
                    See different conversation flows in action - from simple FAQs to
                    complex multi-step interactions.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Satisfaction</h3>
                  <p className="text-gray-600">
                    Experience how our chatbot handles customer queries efficiently,
                    leading to higher satisfaction rates.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6 flex items-center justify-center gap-2"
            >
              Try Interactive Demo <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

