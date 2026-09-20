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
