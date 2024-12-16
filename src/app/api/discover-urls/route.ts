import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { chromium, Browser } from 'playwright'

// Cache the browser instance
let browserInstance: Browser | null = null

// Single cleanup function
const cleanup = async () => {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

// Add cleanup listener only once
if (!process.listeners('exit').some(listener => listener.name === 'cleanup')) {
  process.on('exit', cleanup)
  
  // Also clean up on other termination signals
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  
  // Handle unhandled rejections and exceptions
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    cleanup()
  })
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    cleanup()
  })
}

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ 
      headless: true,
    })
  }
  return browserInstance
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function normalizeUrl(inputUrl: string): string {
  try {
    // If URL is valid as-is, return it
    new URL(inputUrl)
    return inputUrl
  } catch {
    try {
      // Try adding https://
      const urlWithHttps = `https://${inputUrl}`
      new URL(urlWithHttps)
      return urlWithHttps
    } catch {
      return ''
    }
  }
}

async function getUrlsWithPlaywright(url: string): Promise<string[]> {
  const browser = await getBrowser()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 })
    
    // Wait for content to be available
    await Promise.race([
      page.waitForSelector('.container', { timeout: 30000 }),
      page.waitForSelector('main', { timeout: 30000 }),
      page.waitForSelector('article', { timeout: 30000 })
    ]).catch(() => console.log('Content selector wait timed out'))

    const { links, content } = await page.evaluate(() => {
      // Helper function to extract text from elements
      const extractText = (element: Element): string => {
        // Skip script and style elements
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
          return '';
        }

        // Get text from this element
        let text = '';
        if (element.childNodes.length === 0) {
          text = element.textContent?.trim() || '';
        } else {
          // Recursively get text from child elements
          for (const child of Array.from(element.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              text += child.textContent?.trim() + ' ';
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              text += extractText(child as Element) + ' ';
            }
          }
        }
        return text.trim();
      }

      // Get main content container
      const mainContent = document.querySelector('.container, main, article');
      const contentElements = mainContent || document.body;
      
      // Extract text content
      const cleanContent = extractText(contentElements)
        .replace(/\s+/g, ' ')
        .trim();

      // Get all anchor tags and extract normalized hrefs
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const hrefs = anchors
        .map(a => a.getAttribute('href'))
        .filter((href): href is string => href !== null && !href.startsWith('#'));

      return {
        links: hrefs,
        content: cleanContent
      };
    });

    return links;
  } finally {
    await context.close()
  }
}

async function fetchUrlsFromPage(url: string): Promise<string[]> {
  try {
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL format')
    }

    const normalized = normalizeUrl(url)
    if (!normalized) {
      throw new Error('URL normalization failed')
    }

    // Parse the base URL for later comparison
    const baseUrl = new URL(normalized)
    const effectiveBase = new URL(normalized)

    // First try with Cheerio (faster)
    const response = await fetch(normalized, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)
    const urls = new Set<string>()

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return
      }

      try {
        const absoluteUrl = new URL(href, effectiveBase.href)
        if (absoluteUrl.hostname === baseUrl.hostname) {
          absoluteUrl.hash = ''
          const normalizedUrl = absoluteUrl.href.replace(/\/$/, '')
          urls.add(normalizedUrl)
        }
      } catch (e) {
        console.warn('Invalid URL:', e)
      }
    })

    // If we found very few links, try Playwright as a fallback
    if (urls.size < 3) {
      console.log('Few links found with Cheerio, trying Playwright for:', normalized)
      try {
        const playwrightLinks = await getUrlsWithPlaywright(normalized)
        
        // Process Playwright links
        for (const href of playwrightLinks) {
          try {
            const absoluteUrl = new URL(href, effectiveBase.href)
            if (absoluteUrl.hostname === baseUrl.hostname) {
              absoluteUrl.hash = ''
              const normalizedUrl = absoluteUrl.href.replace(/\/$/, '')
              urls.add(normalizedUrl)
            }
          } catch (e) {
            console.warn('Invalid Playwright URL:', e)
          }
        }
      } catch (playwrightError) {
        console.error('Playwright fallback failed:', playwrightError)
      }
    }

    return Array.from(urls)
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return []
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const normalized = normalizeUrl(url)
    if (!normalized) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const urls = await fetchUrlsFromPage(normalized)
    
    // Ensure the original URL is included
    urls.unshift(normalized)
    
    return NextResponse.json({
      urls: Array.from(new Set(urls)), // Remove any duplicates
      success: true
    })
  } catch (error) {
    console.error('Error in discover-urls:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to discover URLs',
        success: false
      },
      { status: 500 }
    )
  }
}
