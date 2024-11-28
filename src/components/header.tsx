'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSmoothScroll } from '@/hooks/use-smooth-scroll'
import { useSupabase } from '@/lib/supabase/provider'
import { LogOut, LogIn } from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollToSection } = useSmoothScroll()
  const { supabase, session } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <header className={`w-full py-4 px-6 fixed top-0 z-50 transition-all duration-200 ${
      isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-sm' : 'bg-white'
    }`}>
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">AnswerlyAI</Link>
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
          <Link href="/faq">
            <Button variant="ghost">FAQ Upload</Button>
          </Link>
          {session ? (
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button 
                variant="ghost"
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
          <Button className="bg-blue-500 hover:bg-blue-600 text-white ml-4">
            Pre-launch special: 70% off
          </Button>
        </nav>
      </div>
    </header>
  )
}

