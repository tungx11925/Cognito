import { 
  searchRepository, 
  SearchDocumentsOptions, 
  SearchCommunityOptions, 
  SearchQuestionSetsOptions, 
  SearchProfilesOptions 
} from '../repositories/search.repository';

export interface UnifiedSearchQuery {
  q?: string;
  tab?: 'all' | 'documents' | 'community' | 'question_sets' | 'profiles';
  category?: string;
  type?: string;
  sort?: 'relevance' | 'latest' | 'popular';
  page?: number;
  limit?: number;
  onlyMine?: boolean;
}

export class SearchService {
  /**
   * Main unified search dispatcher
   */
  async search(userId?: number, query: UnifiedSearchQuery = {}) {
    const tab = query.tab || 'all';
    const q = query.q?.trim() || '';

    if (tab === 'all') {
      // Execute scoped lightweight queries for each category (top 5 each)
      const [documents, community, questionSets, profiles] = await Promise.all([
        searchRepository.searchDocuments(userId, { q, category: query.category, limit: 5, page: 1, sort: 'relevance', onlyMine: query.onlyMine }),
        searchRepository.searchCommunity({ q, type: query.type, limit: 5, page: 1, sort: 'relevance' }),
        searchRepository.searchQuestionSets(userId, { q, limit: 5, page: 1, sort: 'relevance' }),
        searchRepository.searchProfiles(userId, { q, limit: 5, page: 1 }),
      ]);

      const totalResults = documents.total + community.total + questionSets.total + profiles.total;

      return {
        tab: 'all',
        q,
        total: totalResults,
        results: {
          documents: documents.items,
          community: community.items,
          question_sets: questionSets.items,
          profiles: profiles.items,
        },
        counts: {
          documents: documents.total,
          community: community.total,
          question_sets: questionSets.total,
          profiles: profiles.total,
        },
      };
    }

    if (tab === 'documents') {
      const res = await searchRepository.searchDocuments(userId, {
        q,
        category: query.category,
        sort: (query.sort === 'latest' ? 'latest' : 'relevance'),
        page: query.page,
        limit: query.limit,
        onlyMine: query.onlyMine,
      });
      return { tab: 'documents', q, ...res };
    }

    if (tab === 'community') {
      const res = await searchRepository.searchCommunity({
        q,
        type: query.type,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
      });
      return { tab: 'community', q, ...res };
    }

    if (tab === 'question_sets') {
      const res = await searchRepository.searchQuestionSets(userId, {
        q,
        sort: (query.sort === 'latest' ? 'latest' : 'relevance'),
        page: query.page,
        limit: query.limit,
      });
      return { tab: 'question_sets', q, ...res };
    }

    if (tab === 'profiles') {
      const res = await searchRepository.searchProfiles(userId, {
        q,
        page: query.page,
        limit: query.limit,
      });
      return { tab: 'profiles', q, ...res };
    }

    return { tab: 'all', q, total: 0, results: {} };
  }

  /**
   * Fast autocomplete suggestions
   */
  async getSuggestions(q: string) {
    if (!q || !q.trim()) return [];
    return searchRepository.getSuggestions(q.trim(), 8);
  }
}

export const searchService = new SearchService();
