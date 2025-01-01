import { Calendar, MessageSquare, BarChart3, FileQuestion, Globe, RefreshCw, Zap } from 'lucide-react'
import Script from 'next/script'

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full pb-24 pt-12 bg-gradient-to-br from-blue-50 via-white to-blue-50">
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
          {/* Scheduling */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Smart Scheduling</h3>
            <p className="text-gray-600">
              Automatically handle meeting and appointment scheduling. Your AI Agent manages 
              your calendar, sends confirmations, and handles rescheduling requests.
            </p>
          </div>

          {/* FAQ & Knowledge Base */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <FileQuestion className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Instant Answers</h3>
            <p className="text-gray-600">
              From FAQs to complex queries about your products or services, get instant, 
              accurate responses drawn from your knowledge base.
            </p>
          </div>

          {/* Support Tickets */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Support Management</h3>
            <p className="text-gray-600">
              Handle customer support tickets efficiently. Collect information, provide solutions, 
              and escalate complex issues when necessary.
            </p>
          </div>

          {/* Policy Navigation */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
              <RefreshCw className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Policy Assistance</h3>
            <p className="text-gray-600">
              Guide customers through refund, replacement, and other policy-related queries. 
              Clear explanations of terms and procedures on demand.
            </p>
          </div>

          {/* Feedback Collection */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Feedback Collection</h3>
            <p className="text-gray-600">
              Actively gather and process customer feedback. Turn insights into actionable 
              improvements for your business.
            </p>
          </div>

          {/* Website Navigation */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Website Guide</h3>
            <p className="text-gray-600">
              Help visitors navigate your website efficiently. Direct them to relevant 
              information and resources instantly.
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
