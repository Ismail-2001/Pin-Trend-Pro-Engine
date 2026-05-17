export interface KeywordPackage {
  id: string;
  keyword: string;
  type: "seasonal" | "evergreen" | "trending";
  intent: string;
  audience_segment: string;
  trend_score: number;
  competition_level: "high" | "medium" | "low";
  estimated_monthly_searches: string;
  seasonal_window?: string;
  pin_format: string;
  pin_title_en: string;
  pin_title_es: string;
  pin_description_en: string;
  pin_description_es: string;
  image_prompt: string;
  suggested_blog_index: number;
  suggested_blog_reason: string;
  monetization_angle: string;
  ab_test_title_en: string;
  content_hook?: string;
}

export interface BatchRecord {
  id: string;
  timestamp: string;
  keyword_count: number;
  seasonal_count: number;
  evergreen_count: number;
  trending_count: number;
  season_context: string;
  keywords: KeywordPackage[];
}

export interface AppSettings {
  anthropicApiKey: string;
  blogUrls: string[];
  defaultKeywordCount: number;
  defaultSeasonalCount: number;
  defaultEvergreenCount: number;
  defaultTrendingCount: number;
}

export interface GenerationResult {
  keywords: KeywordPackage[];
  run_metadata: {
    keyword_count: number;
    seasonal_count: number;
    evergreen_count: number;
    trending_count: number;
    season_context: string;
  };
}
