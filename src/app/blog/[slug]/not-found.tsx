import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <Link 
            href="/blog"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Blog
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
} 