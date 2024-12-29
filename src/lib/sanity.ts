import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from '@/lib/sanity/client'
import type { Image } from 'sanity'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: Image | string) {
  return builder.image(source)
} 