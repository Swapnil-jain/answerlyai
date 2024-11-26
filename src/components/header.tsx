'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSmoothScroll } from '@/hooks/use-smooth-scroll'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollToSection } = useSmoothScroll()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`w-full py-4 px-6 fixed top-0 z-50 transition-all duration-200 ${
      isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-sm' : 'bg-white'
    }`}>
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">SmartBotify</Link>
        <nav className="flex items-center space-x-8">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-gray-600 hover:text-blue-600"
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection('waitlist')}
            className="text-gray-600 hover:text-blue-600"
          >
            Waitlist
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-gray-600 hover:text-blue-600"
          >
            Pre-launch offer
          </button>
          <Link href="/builder">
            <Button variant="ghost">Workflow Editor</Button>
          </Link>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-4">
            Pre-launch special: 70% off
          </Button>
        </nav>
      </div>
    </header>
  )
}

