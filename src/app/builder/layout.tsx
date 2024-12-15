'use client'

import AuthGuard from '@/components/auth/AuthGuard'

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        {children}
      </div>
    </AuthGuard>
  )
}