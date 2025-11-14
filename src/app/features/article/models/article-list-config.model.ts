export interface ArticleListConfig {
  readonly type: string;
  readonly filters: ArticleListFilters;
  readonly currentPage?: number;
}

interface ArticleListFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit?: number;
  readonly offset?: number;
}
