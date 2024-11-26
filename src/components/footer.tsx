import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full py-6 bg-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">SmartBotify</h3>
            <p className="text-sm text-gray-500">AI-powered customer support solutions</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-sm text-gray-500 hover:text-blue-600">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-gray-500 hover:text-blue-600">Pricing</Link></li>
              <li><Link href="#" className="text-sm text-gray-500 hover:text-blue-600">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-gray-500 hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-gray-500 hover:text-blue-600">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-500 hover:text-blue-600">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600">
                <Instagram className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4">
          <p className="text-sm text-gray-500 text-center">&copy; 2023 SmartBotify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

