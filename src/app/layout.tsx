import '@/app/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SmartBotify - AI-Assisted Customer Support Bot Builder',
  description: 'Create, customize, and integrate intelligent chatbots into your website effortlessly. Automate queries, save time, and enhance customer satisfaction.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

