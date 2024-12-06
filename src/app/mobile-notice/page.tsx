import Link from 'next/link'

export default function MobileNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Desktop Only Experience</h1>
        <p className="text-gray-600 mb-8">
          Our workflow editor is optimized for desktop use to provide the best possible experience. 
          Please visit us on your desktop to access all features.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
