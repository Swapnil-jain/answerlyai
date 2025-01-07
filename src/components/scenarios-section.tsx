import { Clock, DollarSign } from 'lucide-react'

export default function ScenariosSection() {
  return (
    <section className="w-full bg-white mt-10">
      <div className="container mx-auto px-6 py-16">
        <div>
          <h2 className="text-4xl font-bold text-center mb-6">
            Be the Company That Never Sleeps
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Tired of the old ways? Show your customers you're different. 
            Join the AI revolution and make your competition wonder how you do it while cutting costs by upto 98%.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* E-commerce Support Scenario */}
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-semibold mb-3">Traditional E-commerce Support</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• Managing 1000+ daily product inquiries across channels</p>
                  <p>• 4-6 hour response time → lost sales & customer frustration</p>
                  <p>• $15,000 monthly in salaries, benefits, and training costs</p>
                  <p>• Support limited to business hours</p>
                </div>
                <div className="mt-6 p-4 bg-red-100 rounded-lg">
                  <p className="text-red-700 font-medium">
                    Impact: Lost sales, customer churn, and escalating support costs
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <DollarSign className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-semibold mb-3">With AnswerlyAI's Smart Solution</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• AI handles unlimited inquiries instantly across all channels</p>
                  <p>• 2-second average response time, 24/7/365</p>
                  <p>• 1 support manager overseeing AI operations</p>
                  <p>• Smart product recommendations increasing sales by 25%</p>
                </div>
                <div className="mt-6 p-4 bg-green-100 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Impact: Transform from just another business to the innovative company 
                    everyone talks about. That's the AnswerlyAI difference.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Support Scenario */}
          <div className="bg-white rounded-xl p-8 shadow-lg hidden md:block">
            <div className="flex items-start gap-4 mb-6">
              <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-semibold mb-3">Traditional Technical Support</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• 500+ weekly technical issues across multiple products</p>
                  <p>• 48-hour average resolution time with ticket backlog</p>
                  <p>• 8 specialized engineers handling varying complexity issues</p>
                  <p>• $40,000 monthly for specialized technical staff</p>
                </div>
                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">
                    Impact: Extended downtime, resource bottlenecks, and customer dissatisfaction
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <DollarSign className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-semibold mb-3">With AnswerlyAI's Intelligent Platform</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• AI instantly resolves 90% of common technical issues</p>
                  <p>• Complex cases solved in 2-4 hours with AI assistance</p>
                  <p>• AI-powered documentation parsing and solution matching</p>
                  <p>• 24/7 global technical support coverage</p>
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-600 font-medium">
                    Impact: 75% cost savings, 95% faster resolution, 40% reduction in escalations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
