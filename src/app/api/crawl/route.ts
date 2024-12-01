import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    // Validate URL
    const validUrl = new URL(url)
    
    // Fetch the webpage
    const response = await fetch(validUrl.toString())
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
    console.error('Crawler Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to crawl website' },
      { status: 500 }
    )
  }
} 