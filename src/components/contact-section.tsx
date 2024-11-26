import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How does SmartBotify work?',
    answer: 'SmartBotify uses advanced AI to understand and respond to customer queries. You can easily integrate it into your website and customize its responses.',
  },
  {
    question: 'Is SmartBotify suitable for my industry?',
    answer: 'Yes! SmartBotify is designed to be versatile and can be customized for various industries including\ne-commerce, healthcare, finance, and more.',
  },
  {
    question: 'Can I try SmartBotify before purchasing?',
    answer: 'We offer a free trial period so you can experience the benefits of SmartBotify firsthand before making a commitment.',
  },
]

export default function ContactSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-500 mb-4">Have questions? We're here to help!</p>
            <form className="space-y-4">
              <Input placeholder="Your Name" />
              <Input type="email" placeholder="Your Email" />
              <Textarea placeholder="Your Message" />
              <Button type="submit">Send Message</Button>
            </form>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}

