import { sanityClient as client } from '@/lib/sanity/client'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { portableTextComponents } from '@/lib/sanity/portableTextComponents'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// Add TypeScript interfaces
interface SanityImage {
  _type: 'image'
  asset: {
    _id: string
    url: string
  }
  alt?: string
  caption?: string
}

interface BlockContent {
  _type: 'block'
  _key: string
  children: Array<{
    _key: string
    _type: 'span'
    marks: string[]
    text: string
  }>
  markDefs: Array<{
    _key: string
    _type: string
    href: string
  }>
  style: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote'
}

interface Post {
  title: string
  slug: string
  content: Array<SanityImage | BlockContent>
  publishedAt: string
  coverImage?: string
  excerpt?: string
  author?: {
    name: string
    image?: string
    bio?: any
  }
  categories?: Array<{
    title: string
    slug: string
  }>
}

// Use App Router recommended config
export const dynamic = 'auto'
export const dynamicParams = true
export const revalidate = 60

async function getPost(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    content[] {
      ...,
      _type == "image" => {
        "asset": asset->,
        alt,
        caption
      }
    },
    publishedAt,
    "coverImage": coverImage.asset->url,
    excerpt,
    "author": author->{
      name,
      "image": image.asset->url,
      bio
    },
    "categories": categories[]->{ 
      title,
      "slug": slug.current
    }
  }`

  try {
    return await client.fetch(query, { slug })
  } catch (error) {
    
    return null
  }
}

export async function generateMetadata({ 
  params 
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const post = await getPost(resolvedParams.slug)
  
  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ 
  params 
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const post = await getPost(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 pt-24">
        <article className="container mx-auto px-4 max-w-4xl">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Link>

          {post.coverImage && (
            <div className="relative aspect-[16/9] w-full mb-12 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          )}

          <div className="space-y-6 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              {post.author && (
                <div className="flex items-center">
                  {post.author.image && (
                    <div className="relative h-10 w-10 mr-3">
                      <Image
                        src={post.author.image}
                        alt={post.author.name}
                        fill
                        className="rounded-full object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <span>By {post.author.name}</span>
                </div>
              )}
              
              <time className="text-gray-500">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>

              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.categories.map(category => (
                    <span 
                      key={category.slug}
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                    >
                      {category.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="prose prose-lg max-w-none mb-16 prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
            <PortableText 
              value={post.content}
              components={portableTextComponents}
            />
          </div>
        </article>
      </div>
      <Footer />
    </main>
  )
} 