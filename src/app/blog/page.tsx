import { sanityClient as client } from '@/lib/sanity/client'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { urlFor } from '@/lib/sanity'

export const revalidate = 120 // Revalidate every 2 minutes

// Add runtime configuration
export const runtime = 'nodejs'

interface PostPreview {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt: string
  coverImage?: string
}

async function getPosts(): Promise<PostPreview[]> {
  const posts = await client.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      "coverImage": coverImage.asset->url
    }
  `, {}, {
    // Add back caching with shorter duration
    next: { revalidate: 60 }
  })
  return posts
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent" style={{ lineHeight: '1.4' }}>
              Our Blog
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Insights, updates, and guides about AI agents and workflow automation
            </p>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {posts.map((post: PostPreview) => (
              <Link key={post._id} href={`/blog/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  {post.coverImage && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={urlFor(post.coverImage).url()}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 flex-grow">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
} 