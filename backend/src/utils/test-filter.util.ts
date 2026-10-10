/**
 * Shared utility to ensure test data (is_test = true) is consistently excluded 
 * from all public queries (search, community feed, leaderboard, user counts, recommendations).
 */

export interface TestFilterOptions {
  /** Optional table or alias prefix (e.g. 'u' -> 'u.is_test = false') */
  alias?: string;
  /** Whether to prefix with AND (default: true) or return standalone condition */
  prefixAnd?: boolean;
}

/**
 * Returns SQL condition string to filter out test records.
 * Example:
 *   excludeTestSQL({ alias: 'u' }) => "AND u.is_test = false"
 *   excludeTestSQL({ alias: 'u', prefixAnd: false }) => "u.is_test = false"
 */
export function excludeTestSQL(options: TestFilterOptions = {}): string {
  const { alias, prefixAnd = true } = options;
  const col = alias ? `${alias}.is_test` : 'is_test';
  const condition = `COALESCE(${col}, false) = false`;
  return prefixAnd ? ` AND ${condition}` : condition;
}

/**
 * Convenience helper for users table
 */
export function excludeTestUsersSQL(alias?: string, prefixAnd = true): string {
  return excludeTestSQL({ alias, prefixAnd });
}

/**
 * Convenience helper for documents table
 */
export function excludeTestDocsSQL(alias?: string, prefixAnd = true): string {
  return excludeTestSQL({ alias, prefixAnd });
}

/**
 * Convenience helper for community_resources table
 */
export function excludeTestCommunitySQL(alias?: string, prefixAnd = true): string {
  return excludeTestSQL({ alias, prefixAnd });
}

/**
 * Convenience helper for test_sets table
 */
export function excludeTestSetsSQL(alias?: string, prefixAnd = true): string {
  return excludeTestSQL({ alias, prefixAnd });
}
