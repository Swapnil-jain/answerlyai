import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="w-full py-6 bg-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold mb-2">AnswerlyAI</h3>
            <p className="text-sm text-gray-700">AI-powered customer support solutions</p>
          </div>
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-3 sm:space-y-2">
              <li><Link href="#features" className="text-sm text-gray-700 hover:text-blue-700">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-gray-700 hover:text-blue-700">Pricing</Link></li>
              <li><Link href="/builder" className="text-sm text-gray-700 hover:text-blue-700">Try Now</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-gray-700 hover:text-blue-700">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-700 hover:text-blue-700">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm text-gray-700 hover:text-blue-700">Refund Policy</Link></li>
            </ul>
          </div>
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold mb-2">Connect</h3>
            <div className="flex items-center space-x-4 mb-4">
              <Link href="https://x.com/AnswerlyAI" className="text-gray-700 hover:text-blue-700 flex items-center gap-2 py-1">
                <span className="text-sm">Follow us on</span>
                <Image 
                  src="/X-icon.svg"
                  alt="X (formerly Twitter) icon"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </Link>
            </div>
            <div>
              <a href="mailto:answerlyai.cloud@gmail.com" 
                 className="text-sm text-gray-700 hover:text-blue-700 block py-1">
                answerlyai.cloud@gmail.com
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-700 text-center">&copy; 2025 AnswerlyAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

