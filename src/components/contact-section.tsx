import { Button } from '@/components/ui/button'
import { Mail, MessageSquare, Phone } from 'lucide-react'

export default function ContactSection() {
  return (
    <section className="w-full py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out to our team for support
            or to learn more about how AnswerlyAI can help your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 p-8 rounded-xl text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="text-gray-600 mb-4">We'll respond within 24 hours</p>
            <a href="mailto:answerlyai.cloud@gmail.com" className="text-blue-600 hover:text-blue-700">
            answerlyai.cloud@gmail.com
            </a>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Available 24/7</p>
            <Button className="bg-blue-600 hover:bg-blue-700">Start Chat</Button>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl text-center hover:shadow-lg transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Schedule a Call</h3>
            <p className="text-gray-600 mb-4">Book a demo with our team</p>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Book Time
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

