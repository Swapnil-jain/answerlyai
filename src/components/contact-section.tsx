import { Mail } from 'lucide-react'
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                  style={{
                    transform: 'translateY(-1px)'
                  }}
                >
                  <path
                    d="M13.5 2c1.93 0 3.5 1.57 3.5 3.5v1c0 .17-.01.33-.03.5h1.53c1.38 0 2.5 1.12 2.5 2.5v10c0 1.38-1.12 2.5-2.5 2.5h-12c-1.38 0-2.5-1.12-2.5-2.5v-10c0-1.38 1.12-2.5 2.5-2.5h1.53c-.02-.17-.03-.33-.03-.5v-1c0-1.93 1.57-3.5 3.5-3.5h4zm0 2h-4c-.83 0-1.5.67-1.5 1.5v1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5zm-6 4h-1c-.28 0-.5.22-.5.5v10c0 .28.22.5.5.5h12c.28 0 .5-.22.5-.5v-10c0-.28-.22-.5-.5-.5h-11zm2 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Live AI Agent</h3>
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
                  AnswerlyAI is an advanced AI-powered platform that helps businesses automate customer support and enhance user engagement through intelligent AI Agent solutions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>What is the difference between AI Agent and Chatbot?</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Chatbots are typically rule-based or simple pattern-matching systems that follow predetermined conversation flows. These were used in the past.</p>
                  <p className="mb-2">AI Agents are:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>More sophisticated</li>
                    <li>Can understand context</li>
                    <li>Can perform complex reasoning</li>
                    <li>Can adapt their responses based on the situation</li>
                    <li>Can handle multiple types of tasks</li>
                    <li>Use advanced language models to generate human-like responses</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How long does making an AI Agent take?</AccordionTrigger>
                <AccordionContent>
                  It is something completely upto you and can take minutes, hours or days, depending on the complexity of the agent. Usually it doesn't take more than 10-15 minutes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How does the AI Agent learn about my business?</AccordionTrigger>
                <AccordionContent>
                  You can train the AI Agent by giving it your website URL, add FAQs manually or via a CSV file, give written instructions or draw a workflow diagram. The AI Agent processes this information to provide accurate responses about your products, services, and policies.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What if I am finding it too complicated/have custom requirements/need any other help ?</AccordionTrigger>
                <AccordionContent>
                  Please mail us at answerlyai.cloud@gmail.com
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}