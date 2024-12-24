interface CachedContext {
  content: string;
  tokens: number;
  lastAccessed: number;
  accessCount: number;
  embeddings?: number[];
  size: number;
}

interface ContextCache {
  [key: string]: CachedContext;
}

// Move type definition outside the class and export it
export type SectionType = 'shipping' | 'returns' | 'warranty' | 'contact';

export class ContextCacheManager {
  private static cache: ContextCache = {};
  private static readonly MAX_CACHE_SIZE = 100;
  private static readonly CACHE_TTL = 1000 * 60 * 30;
  private static totalCacheSize = 0;
  private static readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024;
  private static readonly MAX_ENTRY_SIZE = 5 * 1024 * 1024;
  private static sectionCache: { [key: string]: string } = {};

  // Add more specific patterns based on common scenarios
  private static readonly CONTEXT_PATTERNS: Record<SectionType, {
    pattern: RegExp;
    keywords: string[];
  }> = {
    shipping: {
      pattern: /shipping|delivery|track|order status|confirmation|package/i,
      keywords: ['shipping', 'delivery', 'track', 'package', 'order']
    },
    returns: {
      pattern: /return|refund|exchange|30 days|window|qualify/i,
      keywords: ['return', 'refund', 'exchange', 'window']
    },
    warranty: {
      pattern: /warranty|damaged|repair|support|1-year/i,
      keywords: ['warranty', 'damage', 'repair']
    },
    contact: {
      pattern: /contact|support|help|email|team/i,
      keywords: ['contact', 'support', 'email']
    }
  };

  static async getContext(key: string): Promise<CachedContext | null> {
    const cached = this.cache[key];
    if (cached) {
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      return cached;
    }
    return null;
  }

  static async setContext(
    key: string, 
    content: string, 
    tokens: number,
    embeddings?: number[]
  ): Promise<void> {
    const entrySize = content.length + (embeddings?.length || 0) * 4;
    if (entrySize > this.MAX_ENTRY_SIZE) {
      content = this.compressContent(content);
    }
    
    this.cleanCache();
    this.cache[key] = {
      content,
      tokens,
      embeddings,
      lastAccessed: Date.now(),
      accessCount: 1,
      size: content.length + (embeddings?.length || 0) * 4
    };
  }

  private static cleanCache() {
    if (Object.keys(this.cache).length > this.MAX_CACHE_SIZE * 2) {
      // Force cleanup if cache grows too large
      this.cache = {};
    }
    const now = Date.now();
    const entries = Object.entries(this.cache);

    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.lastAccessed > this.CACHE_TTL) {
        delete this.cache[key];
      }
    });

    // If still too many entries, remove least accessed
    if (Object.keys(this.cache).length > this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .sort(([, a], [, b]) => b.accessCount - a.accessCount)
        .slice(this.MAX_CACHE_SIZE);
      
      sortedEntries.forEach(([key]) => {
        delete this.cache[key];
      });
    }
  }

  static generateCacheKey(context: string): string {
    if (!context) return '';
    try {
      return Buffer.from(context).toString('base64').slice(0, 32);
    } catch {
      return context.slice(0, 32); // Fallback if Buffer fails
    }
  }

  private static initCleanupInterval() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanCache(), 1000 * 60 * 60); // Clean every hour instead of 15 mins
    }
  }

  private static updateTotalSize(delta: number) {
    this.totalCacheSize += delta;
    if (this.totalCacheSize > this.MAX_TOTAL_SIZE) {
      this.cleanCache();
    }
  }

  // Enhanced section extraction
  private static extractSection(content: string, section: SectionType): string {
    const pattern = this.CONTEXT_PATTERNS[section];
    if (!pattern) return '';

    // Try markdown headers first
    const headerMatch = content.match(
      new RegExp(`\\*\\*${section}[^*]+\\*\\*([^*]+)`, 'i')
    );
    if (headerMatch) return headerMatch[1].trim();

    // Try finding relevant paragraphs
    const paragraphs = content.split('\n\n');
    const relevantParagraphs = paragraphs.filter(p => 
      pattern.pattern.test(p) && 
      pattern.keywords.some(k => p.toLowerCase().includes(k))
    );

    return relevantParagraphs.join('\n');
  }

  // Optimize compression based on content type
  private static compressContent(content: string, section?: SectionType): string {
    const base = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/["""'']/g, '"')
      .replace(/\*\*/g, '');

    // Section-specific optimizations
    if (section) {
      const pattern = this.CONTEXT_PATTERNS[section];
      if (pattern) {
        return base
          .split('\n')
          .map(line => {
            // Keep only essential information
            if (pattern.keywords.some(k => line.toLowerCase().includes(k))) {
              return line
                .replace(/^- /, '')
                .replace(/within the/g, 'in')
                .replace(/please /i, '')
                .replace(/\bis available\b/i, 'is')
                .replace(/in order to/i, 'to')
                .replace(/you may/i, 'can')
                .replace(/we offer/i, 'offers')
                .replace(/\b(the|a|an)\s+/gi, '')
                .trim();
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }
    }

    return base;
  }

  static async getContextSection(key: string, section: SectionType): Promise<string | null> {
    const cacheKey = `${key}_${section}`;
    return this.sectionCache[cacheKey] || null;
  }

  static async setContextSection(key: string, section: SectionType, content: string): Promise<void> {
    const cacheKey = `${key}_${section}`;
    const extractedContent = this.extractSection(content, section);
    this.sectionCache[cacheKey] = this.compressContent(extractedContent, section);
  }

  // Call this in constructor or initialization
  static {
    this.initCleanupInterval();
  }
} 