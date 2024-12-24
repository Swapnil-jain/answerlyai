import { encode } from 'gpt-tokenizer'

interface Chunk {
  text: string;
  tokens: number;
  embeddings?: number[];
  keywords: string[];
}

interface ChunkCache {
  [key: string]: {
    chunks: Chunk[];
    lastAccessed: number;
    hitCount: number;
  }
}

// Cache for storing processed chunks
const chunkCache: ChunkCache = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_ITEMS = 100;

// Advanced text preprocessing with keyword extraction
function preprocessText(text: string): { text: string; keywords: string[] } {
  const processedText = text
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/([.!?])[.!?]+/g, '$1')
    .replace(/([.!?,;:])(\w)/g, '$1 $2')
    .trim();

  // Extract keywords using TF-IDF-like approach
  const sentences = processedText.split(/[.!?]+/g);
  const wordFreq: { [key: string]: number } = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  sentences.forEach(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    uniqueWords.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });

  // Get top keywords
  const keywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return { text: processedText, keywords };
}

// Cache management functions
function cleanCache() {
  const now = Date.now();
  const entries = Object.entries(chunkCache);
  
  // Remove expired entries
  entries.forEach(([key, value]) => {
    if (now - value.lastAccessed > CACHE_TTL) {
      delete chunkCache[key];
    }
  });

  // If still too many entries, remove least used
  if (Object.keys(chunkCache).length > MAX_CACHE_ITEMS) {
    const sortedEntries = entries
      .sort(([, a], [, b]) => b.hitCount - a.hitCount)
      .slice(MAX_CACHE_ITEMS);
    
    sortedEntries.forEach(([key]) => {
      delete chunkCache[key];
    });
  }
}

export function chunkText(text: string, maxTokens: number = 300): Chunk[] {
  const cacheKey = `${text.slice(0, 100)}_${maxTokens}`;
  
  // Check cache first
  if (chunkCache[cacheKey]) {
    chunkCache[cacheKey].lastAccessed = Date.now();
    chunkCache[cacheKey].hitCount++;
    return chunkCache[cacheKey].chunks;
  }

  const { text: preprocessed, keywords: docKeywords } = preprocessText(text);
  const paragraphs = preprocessed.split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  let currentKeywords: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length < 20 || !hasSignificantContent(paragraph)) {
      continue;
    }

    const { text: processedParagraph, keywords: paraKeywords } = preprocessText(paragraph);
    const paragraphTokens = encode(processedParagraph).length;

    if (paragraphTokens > maxTokens * 0.8) {
      const sentences = processedParagraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        if (sentence.length < 10) continue;
        
        const { text: processedSentence, keywords: sentenceKeywords } = preprocessText(sentence);
        const sentenceTokens = encode(processedSentence).length;

        if (currentTokens + sentenceTokens > maxTokens * 0.9) {
          if (currentChunk) {
            chunks.push({
              text: currentChunk.trim(),
              tokens: currentTokens,
              keywords: currentKeywords
            });
            currentChunk = '';
            currentTokens = 0;
            currentKeywords = [];
          }
        }

        currentChunk += (currentChunk ? ' ' : '') + processedSentence;
        currentTokens += sentenceTokens;
        currentKeywords = [...new Set([...currentKeywords, ...sentenceKeywords])].slice(0, 5);
      }
    } else if (currentTokens + paragraphTokens > maxTokens) {
      chunks.push({
        text: currentChunk.trim(),
        tokens: currentTokens,
        keywords: currentKeywords
      });
      currentChunk = processedParagraph;
      currentTokens = paragraphTokens;
      currentKeywords = paraKeywords;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + processedParagraph;
      currentTokens += paragraphTokens;
      currentKeywords = [...new Set([...currentKeywords, ...paraKeywords])];
    }
  }

  if (currentChunk) {
    chunks.push({
      text: currentChunk.trim(),
      tokens: currentTokens,
      keywords: currentKeywords
    });
  }

  // Store in cache
  chunkCache[cacheKey] = {
    chunks,
    lastAccessed: Date.now(),
    hitCount: 1
  };

  // Clean cache if needed
  cleanCache();

  return chunks;
}

export function findRelevantChunks(chunks: Chunk[], query: string, maxTotalTokens: number = 2000): string {
  const { keywords: queryKeywords } = preprocessText(query);
  
  // Score chunks using multiple relevance signals
  const scoredChunks = chunks.map(chunk => ({
    ...chunk,
    score: calculateChunkRelevance(chunk, query, queryKeywords)
  }));

  // Sort by score and respect token limit
  scoredChunks.sort((a, b) => b.score - a.score);

  let totalTokens = 0;
  const selectedChunks: string[] = [];

  for (const chunk of scoredChunks) {
    if (chunk.score === 0) continue;

    if (totalTokens + chunk.tokens <= maxTotalTokens) {
      selectedChunks.push(chunk.text);
      totalTokens += chunk.tokens;
    } else {
      break;
    }
  }

  return selectedChunks.join('\n\n');
}

function calculateChunkRelevance(chunk: Chunk, query: string, queryKeywords: string[]): number {
  let score = 0;

  // Keyword matching
  const keywordMatches = queryKeywords.filter(keyword => 
    chunk.keywords.includes(keyword)
  ).length;
  score += keywordMatches * 2;

  // Exact phrase matching
  if (chunk.text.toLowerCase().includes(query.toLowerCase())) {
    score += 5;
  }

  // Semantic similarity (basic implementation)
  const queryWords = new Set(query.toLowerCase().split(/\s+/));
  const chunkWords = new Set(chunk.text.toLowerCase().split(/\s+/));
  queryWords.forEach(word => {
    if (chunkWords.has(word)) {
      score += 1;
    }
  });

  // Density scoring
  const density = keywordMatches / chunk.tokens;
  score += density * 3;

  return score;
}

function hasSignificantContent(text: string): boolean {
  const significantWords = text.toLowerCase().match(/\b\w{4,}\b/g)?.length || 0;
  return significantWords >= 3;
}
