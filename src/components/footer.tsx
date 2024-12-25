import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="w-full py-6 bg-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">AnswerlyAI</h3>
            <p className="text-sm text-gray-500">AI-powered customer support solutions</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-sm text-gray-500 hover:text-blue-600">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-gray-500 hover:text-blue-600">Pricing</Link></li>
              <li><Link href="/builder" className="text-sm text-gray-500 hover:text-blue-600">Try Now</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-500 hover:text-blue-600">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm text-gray-500 hover:text-blue-600">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect</h3>
            <div className="flex items-center space-x-4">
              <Link href="https://x.com/AnswerlyAI" className="text-gray-500 hover:text-blue-600 flex items-center gap-2">
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
            <div className="mt-4">
              <a href="mailto:answerlyai.cloud@gmail.com" className="text-sm text-gray-500 hover:text-blue-600">
              answerlyai.cloud@gmail.com
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4">
          <p className="text-sm text-gray-500 text-center">&copy; 2024 AnswerlyAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

