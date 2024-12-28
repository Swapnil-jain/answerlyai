import { Code2, MousePointer2, BarChart3, Sparkles, Globe, LogIn, Zap } from 'lucide-react'
import Script from 'next/script'

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-medium text-blue-600">Only.Relevant.Features.</span>
          </div>
          <h2 className="text-4xl font-bold mb-6">Why Choose AnswerlyAI?</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Imagine having an AI-powered team member that never sleeps, never takes breaks, 
            and delights your customers 24/7. Join the future of customer support.
          </p>
          <div className="bg-gray-50 p-6 rounded-2xl max-w-3xl mx-auto">
            <p className="text-base sm:text-lg text-gray-700 italic">
              "Over 95% of users never touch 80% of features in typical tools—we're different: 
              AnswerlyAI offers only the most relevant, simple-to-use features you actually need."
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* No Code Required */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Code2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Zero Code Required</h3>
            <p className="text-gray-600">
              Focus on what matters - your customers. No coding knowledge needed.
              We handle all the technical complexities behind the scenes.
            </p>
          </div>

          {/* Multiple Setup Options */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <MousePointer2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Your Way, Your Choice</h3>
            <p className="text-gray-600">
              Type it out, import your website content, or create visual flowcharts.
              Choose the method that works best for you. We support all approaches.
            </p>
          </div>

          {/* Real-time Analytics */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Real-Time Analytics</h3>
            <p className="text-gray-600">
              Watch your AI agent perform in real-time. Track user interactions,
              satisfaction rates, and identify areas for improvement instantly.
            </p>
          </div>

          {/* Simple UI */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Intuitive Interface</h3>
            <p className="text-gray-600">
              A clean, simple interface that just makes sense. No overwhelming menus
              or confusing options. Everything you need, right where you expect it.
            </p>
          </div>

          {/* Easy Integration */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">One-Line Integration</h3>
            <p className="text-gray-600">
              Add your AI agent to any website with a single line of code.
              Copy, paste, and you're ready to go. It's that simple.
            </p>
          </div>

          {/* Quick Start */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <LogIn className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Instant Access</h3>
            <p className="text-gray-600">
              Sign up with Google and start building immediately. Create and deploy
              your first AI agent in minutes.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Get Started in Minutes</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join dozens of businesses already using AnswerlyAI to transform their
            customer support experience.
          </p>
        </div>
        <div className="mt-12 mb-4">
          <div className="max-w-8xl mx-auto">
            <div
              className="senja-embed"
              data-id="04fbb1cb-45cb-4c66-a9ff-fdb52ce4f487"
              data-mode="shadow"
              data-lazyload="false"
              style={{ minHeight: '200px', maxHeight: '200px' }}
            />
            <Script
              async
              type="text/javascript"
              src="https://static.senja.io/dist/platform.js"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
