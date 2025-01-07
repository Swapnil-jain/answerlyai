import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function middleware(request: NextRequest) {
  // Special handling for widget requests - no compression
  if (request.nextUrl.pathname.startsWith('/api/widget/')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Content-Type', 'application/javascript')
    response.headers.delete('Content-Encoding')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

export default middleware 