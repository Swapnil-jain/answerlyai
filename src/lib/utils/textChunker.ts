import { encode } from 'gpt-tokenizer'

interface Chunk {
  text: string;
  tokens: number;
}

// Advanced text preprocessing
function preprocessText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove multiple punctuation
    .replace(/([.!?])[.!?]+/g, '$1')
    // Ensure proper spacing after punctuation
    .replace(/([.!?,;:])(\w)/g, '$1 $2')
    .trim();
}

// Extract key phrases (simple implementation)
function extractKeyPhrases(text: string): Set<string> {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = new Set<string>();
  
  // Single words (excluding stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  words.forEach(word => {
    if (word.length > 3 && !stopWords.has(word)) {
      phrases.add(word);
    }
  });
  
  // Bigrams (pairs of words)
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      phrases.add(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  return phrases;
}

// Score chunk relevance using multiple factors
function scoreChunkRelevance(chunk: string, query: string): number {
  const chunkLower = chunk.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Get key phrases
  const queryPhrases = extractKeyPhrases(queryLower);
  const chunkPhrases = extractKeyPhrases(chunkLower);
  
  let score = 0;
  
  // 1. Exact phrase matches (highest weight)
  if (chunkLower.includes(queryLower)) {
    score += 10;
  }
  
  // 2. Key phrase matches
  queryPhrases.forEach(phrase => {
    if (chunkPhrases.has(phrase)) {
      score += 5;
    }
  });
  
  // 3. Word proximity scoring
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
  let foundWords = 0;
  let lastIndex = -1;
  let proximityScore = 0;
  
  for (const word of queryWords) {
    const index = chunkLower.indexOf(word);
    if (index !== -1) {
      foundWords++;
      if (lastIndex !== -1) {
        // Add proximity score - closer words get higher scores
        proximityScore += 1 / Math.max(1, Math.abs(index - lastIndex));
      }
      lastIndex = index;
    }
  }
  
  score += (foundWords / queryWords.length) * 3; // Word coverage
  score += proximityScore * 2; // Word proximity
  
  // 4. Semantic indicators
  const semanticIndicators = [
    'definition', 'meaning', 'example', 'such as', 'like',
    'refers to', 'is a', 'means', 'defined as'
  ];
  
  for (const indicator of semanticIndicators) {
    if (chunkLower.includes(indicator)) {
      score += 1;
    }
  }
  
  return score;
}

export function chunkText(text: string, maxTokens: number = 500): Chunk[] {
  const preprocessed = preprocessText(text);
  
  // Split into paragraphs first
  const paragraphs = preprocessed.split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = encode(paragraph).length;
    
    if (paragraphTokens > maxTokens) {
      // Split large paragraphs into sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        const sentenceTokens = encode(sentence).length;
        
        if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
          chunks.push({
            text: currentChunk.trim(),
            tokens: currentTokens
          });
          currentChunk = '';
          currentTokens = 0;
        }
        
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    } else if (currentTokens + paragraphTokens > maxTokens) {
      chunks.push({
        text: currentChunk.trim(),
        tokens: currentTokens
      });
      currentChunk = paragraph;
      currentTokens = paragraphTokens;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentTokens += paragraphTokens;
    }
  }
  
  if (currentChunk) {
    chunks.push({
      text: currentChunk.trim(),
      tokens: currentTokens
    });
  }
  
  return chunks;
}

export function findRelevantChunks(chunks: Chunk[], query: string, maxTotalTokens: number = 2000): string {
  // Score chunks using our sophisticated scoring function
  const scoredChunks = chunks.map(chunk => ({
    ...chunk,
    score: scoreChunkRelevance(chunk.text, query)
  }));
  
  // Sort by score (highest first)
  scoredChunks.sort((a, b) => b.score - a.score);
  
  // Take chunks until we hit maxTotalTokens
  let totalTokens = 0;
  const selectedChunks: string[] = [];
  
  for (const chunk of scoredChunks) {
    if (chunk.score === 0) continue; // Skip completely irrelevant chunks
    
    if (totalTokens + chunk.tokens <= maxTotalTokens) {
      selectedChunks.push(chunk.text);
      totalTokens += chunk.tokens;
    } else {
      break;
    }
  }
  
  return selectedChunks.join('\n\n');
}
