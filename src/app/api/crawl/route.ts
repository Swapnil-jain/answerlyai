import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    // Add validation for URL
    if (!url || !url.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid URL' },
        { status: 400 }
      )
    }

    // Add protocol if missing
    let urlWithProtocol = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlWithProtocol = `https://${url}`
    }

    // Add error handling for URL parsing
    let validUrl: URL
    try {
      validUrl = new URL(urlWithProtocol)
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Add timeout and error handling for fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(validUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AnswerlyAI/1.0; +http://answerly.ai)'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()

      // Parse HTML
      const $ = cheerio.load(html)

      // Remove unwanted elements
      $('script').remove()
      $('style').remove()
      $('nav').remove()
      $('footer').remove()
      $('header').remove()
      $('[role="navigation"]').remove()
      $('.navigation').remove()
      $('.footer').remove()
      $('.header').remove()

      // Extract text content
      let content = ''

      // Get meta description
      const metaDescription = $('meta[name="description"]').attr('content')
      if (metaDescription) {
        content += `Website Description: ${metaDescription}\n\n`
      }

      // Get main content
      $('main, article, .content, #content, .main-content').each((_, element) => {
        content += $(element).text().trim() + '\n'
      })

      // If no main content found, get body content
      if (!content.trim()) {
        content = $('body').text()
      }

      // Clean up the text
      const cleanContent = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      // Summarize and structure the content
      const websiteContent = `
Website: ${validUrl.hostname}
Last Crawled: ${new Date().toISOString()}

Content:
${cleanContent}
      `.trim()

      return NextResponse.json({
        success: true,
        websiteContent
      })

    } catch (error) {
      clearTimeout(timeoutId)
      
      return NextResponse.json(
        { 
          success: false, 
          message: error instanceof Error ? error.message : 'Failed to crawl website'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    
    return NextResponse.json(
      { success: false, message: 'Failed to crawl website' },
      { status: 500 }
    )
  }
} 