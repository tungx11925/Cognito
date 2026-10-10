/**
 * Calculates cosine similarity between two vectors.
 * Returns a value between -1 and 1.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Basic TF-IDF calculator for a list of documents.
 */
export class TfIdfCalculator {
  private documents: string[] = [];
  private termDocumentCounts: Map<string, number> = new Map();
  private documentTokens: string[][] = [];

  constructor(documents: string[]) {
    this.documents = documents;
    this.processDocuments();
  }

  private tokenize(text: string): string[] {
    // Simple tokenizer: lowercase and split by non-word characters, remove empty
    // Supports Vietnamese characters roughly
    return text.toLowerCase()
      .split(/[\s,.;:!?()[\]{}"'<>/\\]+/)
      .filter(t => t.trim().length > 0);
  }

  private processDocuments() {
    this.documents.forEach(doc => {
      const tokens = this.tokenize(doc);
      this.documentTokens.push(tokens);
      
      // Count unique terms in this document for IDF
      const uniqueTerms = new Set(tokens);
      uniqueTerms.forEach(term => {
        this.termDocumentCounts.set(term, (this.termDocumentCounts.get(term) || 0) + 1);
      });
    });
  }

  /**
   * Calculates TF-IDF for a multi-word phrase or single word in a specific document (by index).
   */
  public getScore(term: string, docIndex: number): number {
    if (docIndex < 0 || docIndex >= this.documents.length) return 0;
    
    const tokens = this.documentTokens[docIndex];
    if (tokens.length === 0) return 0;

    const termTokens = this.tokenize(term);
    if (termTokens.length === 0) return 0;

    // For multi-word terms, we'll check exact sequence match in the document tokens
    let termFrequency = 0;
    
    if (termTokens.length === 1) {
      // Single word
      termFrequency = tokens.filter(t => t === termTokens[0]).length;
    } else {
      // Multi-word phrase
      for (let i = 0; i <= tokens.length - termTokens.length; i++) {
        let match = true;
        for (let j = 0; j < termTokens.length; j++) {
          if (tokens[i + j] !== termTokens[j]) {
            match = false;
            break;
          }
        }
        if (match) termFrequency++;
      }
    }

    if (termFrequency === 0) return 0;

    // TF: Raw frequency / total tokens in document
    const tf = termFrequency / tokens.length;

    // For multi-word, we approximate IDF by taking the average IDF of its words, 
    // or just checking how many docs contain the exact phrase.
    // Let's count how many docs contain the exact phrase.
    let docsWithTerm = 0;
    if (termTokens.length === 1) {
      docsWithTerm = this.termDocumentCounts.get(termTokens[0]) || 0;
    } else {
      // Count docs with the phrase
      for (const doc of this.documentTokens) {
        for (let i = 0; i <= doc.length - termTokens.length; i++) {
          let match = true;
          for (let j = 0; j < termTokens.length; j++) {
            if (doc[i + j] !== termTokens[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            docsWithTerm++;
            break;
          }
        }
      }
    }

    if (docsWithTerm === 0) return 0;

    // IDF: log(N / docsWithTerm) + 1 (smoothing)
    const idf = Math.log(this.documents.length / docsWithTerm) + 1;

    return tf * idf;
  }
}

/**
 * Maps an array to promises with a concurrency limit.
 */
export async function asyncMapConcurrent<T, R>(
  array: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(array.length);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < array.length) {
      const index = currentIndex++;
      results[index] = await mapper(array[index], index);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, array.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Calculates Jaccard similarity between two text strings.
 * Used as a lexical deduplication fallback when vector embeddings are not available.
 * Returns a value between 0 and 1.
 */
export function jaccardSimilarity(strA: string, strB: string): number {
  const setA = new Set(strA.toLowerCase().split(/[\s,.;:!?()[\]{}"'<>/\\]+/).filter(Boolean));
  const setB = new Set(strB.toLowerCase().split(/[\s,.;:!?()[\]{}"'<>/\\]+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface SlideAllocation {
  chunkId: number;
  weight: number;
  allocated: number;
}

/**
 * Phân bổ số lượng câu hỏi đều theo các slide/chunk theo trọng số nội dung.
 * Đảm bảo mọi chunk đều có ít nhất 1 câu hỏi khi số lượng câu >= số lượng chunk,
 * và không chunk nào bị dồn quá maxPerSlide câu.
 */
export function calculateCoverageAllocation(
  contentSlides: { id: number; content: string; keywords?: string[] }[],
  finalFocusKeywords: string[],
  quantity: number,
  maxMultiplier = 2
): SlideAllocation[] {
  if (contentSlides.length === 0 || quantity <= 0) return [];

  const slideAllocations: SlideAllocation[] = contentSlides.map(c => {
    const matchCount = finalFocusKeywords.filter(kw => 
      (c.keywords || []).includes(kw) || c.content.toLowerCase().includes(kw.toLowerCase())
    ).length;
    return { chunkId: c.id, weight: Math.max(matchCount, 0.1), allocated: 0 };
  });

  const totalWeight = slideAllocations.reduce((s, a) => s + a.weight, 0);
  const maxPerSlide = Math.ceil(quantity / slideAllocations.length) * maxMultiplier;

  let remaining = quantity;
  if (quantity >= slideAllocations.length) {
    // Mỗi slide được ít nhất 1 câu hỏi để đảm bảo độ bao phủ (coverage) toàn diện
    for (const alloc of slideAllocations) {
      alloc.allocated = 1;
    }
    remaining = quantity - slideAllocations.length;

    for (const alloc of slideAllocations) {
      if (remaining <= 0) break;
      const proposedExtra = Math.floor((alloc.weight / totalWeight) * (quantity - slideAllocations.length));
      const canAdd = Math.min(proposedExtra, maxPerSlide - alloc.allocated, remaining);
      alloc.allocated += canAdd;
      remaining -= canAdd;
    }
    for (let i = 0; remaining > 0; i++) {
      const idx = i % slideAllocations.length;
      if (slideAllocations[idx].allocated < maxPerSlide) {
        slideAllocations[idx].allocated++;
        remaining--;
      }
    }
  } else {
    // Số câu ít hơn số slide: ưu tiên các slide có trọng số cao nhất
    const sorted = [...slideAllocations].sort((a, b) => b.weight - a.weight);
    for (let i = 0; i < quantity; i++) {
      sorted[i].allocated = 1;
    }
  }

  return slideAllocations;
}


