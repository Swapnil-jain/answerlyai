import { Button } from '@/components/ui/button'
import { Mail, MessageSquare, Phone } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function ContactSection() {
  return (
    <section id="contact" className="w-full py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions? We're here to help. Reach out to our team for support
            or to learn more about how AnswerlyAI can help your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Information - Left Side */}
          <div className="space-y-4 max-w-md">
            <div className="bg-blue-50 p-6 rounded-xl text-center hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-gray-600 mb-3 text-sm">We'll respond within 24 hours</p>
              <a href="mailto:answerlyai.cloud@gmail.com" className="text-blue-600 hover:text-blue-700 text-sm">
                answerlyai.cloud@gmail.com
              </a>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl text-center hover:shadow-lg transition-shadow duration-200">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chatbot</h3>
              <p className="text-gray-600 mb-3 text-sm">Available 24/7</p>
            </div>
          </div>

          {/* FAQs - Right Side */}
          <div className="bg-gray-50 p-6 rounded-xl max-w-md">
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is AnswerlyAI?</AccordionTrigger>
                <AccordionContent>
                  AnswerlyAI is an advanced AI-powered platform that helps businesses automate customer support and enhance user engagement through intelligent chatbot solutions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How does the pricing work?</AccordionTrigger>
                <AccordionContent>
                  We offer flexible pricing plans based on your business needs. Contact us for a customized quote that fits your requirements.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How quickly can I get started?</AccordionTrigger>
                <AccordionContent>
                  You can get started immediately after signing up. Our intuitive platform allows you to create and deploy your first chatbot within minutes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>How long does making a chatbot take?</AccordionTrigger>
                <AccordionContent>
                  It is something completely upto you and can take minutes, hours or days, depending on the complexity of the chatbot.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Do you offer technical support?</AccordionTrigger>
                <AccordionContent>
                  Yes, we provide 24/7 technical support to ensure your chatbot runs smoothly and efficiently. Please use the email provided or use our chatbot to get in touch.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}