import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SupabaseProvider from '@/lib/supabase/provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AnswerlyAI',
  description: 'AI chatbot widget helping you convert visitors into paying users',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </SupabaseProvider>
      </body>
    </html>
  )
}

