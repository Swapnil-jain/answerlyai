import { NextResponse } from 'next/server'
import { chromium } from 'playwright'
import { JSDOM } from 'jsdom'
import axios from 'axios'

function sanitizeContent(content: string): string {
  return content
    // Replace multiple newlines with a single newline
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple spaces with a single space
    .replace(/[ \t]+/g, ' ')
    // Remove spaces before newlines
    .replace(/[ \t]+\n/g, '\n')
    // Remove spaces after newlines
    .replace(/\n[ \t]+/g, '\n')
    // Trim whitespace from start and end
    .trim()
}

async function extractContent(url: string) {
  try {
    // First try with a simple HTTP request
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    })

    if (response.status >= 400) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    let content = ''
    let title = ''

    // Try parsing with JSDOM first
    try {
      const dom = new JSDOM(response.data)
      const document = dom.window.document

      // Get title
      title = document.querySelector('title')?.textContent ||
              document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
              document.querySelector('h1')?.textContent ||
              'No title'

      // Remove unwanted elements
      const elementsToRemove = document.querySelectorAll(
        'script, style, link, meta, noscript, iframe, header, footer, nav'
      )
      elementsToRemove.forEach(el => el.remove())

      // Try to find main content
      const selectors = [
        'main',
        'article',
        '#content',
        '.content',
        '#main',
        '.main',
        '[role="main"]',
        '.markdown',
        '.markdown-body',
        '.documentation',
        '.docs-content'
      ]

      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element) {
          content = element.textContent || ''
          if (content.trim()) break
        }
      }

      // If no content found, use body
      if (!content.trim()) {
        content = document.body.textContent || ''
      }
    } catch (error) {
      
      content = response.data
    }

    // If content looks like it might be JavaScript-rendered (very little content or specific markers)
    if (!content.trim() || content.includes('{{') || content.includes('ng-')) {
      // Fall back to Playwright for JavaScript-rendered content
      const browser = await chromium.launch({
        headless: true
      })
      const context = await browser.newContext()
      const page = await context.newPage()

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 })

        // Wait for common content selectors
        const selectors = [
          'main',
          'article',
          '#content',
          '.content',
          '#main',
          '.main',
          '[role="main"]',
          '.markdown',
          '.markdown-body',
          '.documentation',
          '.docs-content'
        ]

        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 15000 })
            break
          } catch {
            continue
          }
        }

        // Extract content
        title = await page.title()
        content = await page.evaluate(() => {
          function extractText(node: Node): string {
            if (node.nodeType === Node.TEXT_NODE) {
              return node.textContent?.trim() || '';
            }
            
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Skip script and style elements
              if (element.tagName.toLowerCase() === 'script' || 
                  element.tagName.toLowerCase() === 'style' ||
                  element.tagName.toLowerCase() === 'noscript') {
                return '';
              }
              
              let text = '';
              for (const child of element.childNodes) {
                const childText = extractText(child);
                if (childText) {
                  text += (text ? ' ' : '') + childText;
                }
              }
              return text;
            }
            
            return '';
          }

          // Try to find main content using common selectors
          const selectors = [
            'main',
            'article',
            '#content',
            '.content',
            '#main',
            '.main',
            '[role="main"]',
            '.markdown',
            '.markdown-body',
            '.documentation',
            '.docs-content'
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              const text = extractText(element);
              if (text.trim()) {
                return text;
              }
            }
          }

          // If no content found in specific selectors, extract from body
          return extractText(document.body);
        })
      } finally {
        await browser.close()
      }
    }

    return {
      url,
      title: sanitizeContent(title.trim() || 'No title'),
      content: sanitizeContent(content.trim() || 'No content'),
      status: 'success'
    }
  } catch (error) {
    
    return {
      url,
      title: '',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }
  }
}

export async function POST(request: Request) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          return await extractContent(url)
        } catch (error) {
          
          return {
            url,
            title: '',
            content: '',
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'error'
          }
        }
      })
    )

    return NextResponse.json({
      results,
      success: true
    })
  } catch (error) {
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to crawl URLs',
        success: false
      },
      { status: 500 }
    )
  }
}