'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewWorkflow() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the workflow editor without an ID for a new workflow
    router.replace('/workflow')
  }, [router])

  return null
} 