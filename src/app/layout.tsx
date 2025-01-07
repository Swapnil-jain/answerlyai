import './globals.css'
import type { Metadata } from 'next'
import SupabaseProvider from '@/lib/supabase/provider'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'AnswerlyAI',
  description: 'No-code, inexpensive AI Agent builder.',
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
        <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GTAG}`}
            strategy="lazyOnload"
            async
            defer
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GTAG}', {
              page_path: window.location.pathname,
              transport_type: 'beacon'
            });
          `}
        </Script>
        <SupabaseProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </SupabaseProvider>
      </body>
    </html>
  )
}