import { Bot, Globe, PenLine, FileText, MousePointer } from 'lucide-react'

export default function WorkflowEditorSection() {
  return (
    <section className="w-full py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Build Your Chatbot, Your Way</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose how you want to create your chatbot. Whether you prefer typing, 
            importing from your website, or drawing flowcharts - we've got you covered.
            No more overwhelming the users with scary interfaces and unncessary features.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Method 1: Website Import */}
          <div className="relative">
            <div className="bg-blue-50 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Import from Website</h3>
              <p className="text-gray-600 mb-6">
                Just give us your website URL. We'll automatically scan your content
                and create a chatbot that can answer questions about your business.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  <span className="text-gray-600">Automatic content scanning</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  <span className="text-gray-600">All pages included</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  <span className="text-gray-600">Auto content updates</span>
                </li>
              </ul>
            </div>
            <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 font-semibold">OR</span>
              </div>
            </div>
          </div>

          {/* Method 2: Visual Builder */}
          <div className="relative">
            <div className="bg-purple-50 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <MousePointer className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Draw Your Flow</h3>
              <p className="text-gray-600 mb-6">
                Design your chatbot's conversation flow visually. Drag, drop, and
                connect different blocks to create the perfect interaction path.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  <span className="text-gray-600">Simple drag & drop interface</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  <span className="text-gray-600">Pre-built conversation blocks</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  <span className="text-gray-600">Real-time preview</span>
                </li>
              </ul>
            </div>
            <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 font-semibold">OR</span>
              </div>
            </div>
          </div>

          {/* Method 3: Text Input */}
          <div className="relative">
            <div className="bg-green-50 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <PenLine className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Type It Out</h3>
              <p className="text-gray-600 mb-6">
                Simply type your questions and answers in plain English. Our AI will
                understand and create a smart chatbot from your text.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span className="text-gray-600">Natural language input</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span className="text-gray-600">AI-powered understanding</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span className="text-gray-600">Quick setup</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Preview */}
        <div className="mt-16 sm:mt-20 text-center px-4 sm:px-0">
          <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h3 className="text-lg sm:text-2xl font-semibold whitespace-nowrap">Your Chatbot, Ready to Go</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              No matter which method you choose, your chatbot will be smart, responsive,
              and ready to help your customers 24/7. Mix and match methods to create
              the perfect solution for your business.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
} 