import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import type { SanityClient } from 'next-sanity'

if (!projectId || !dataset) {
  throw new Error('Missing projectId or dataset. Check your sanity.json or .env')
}

export const client: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega: false,
})

// Export for reuse in other files
export const sanityClient = client 