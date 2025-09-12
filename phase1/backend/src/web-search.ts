/**
 * Web search abstraction supporting multiple providers with graceful fallback.
 * Currently supports:
 *  - Bing Web Search API (requires BING_SEARCH_API_KEY)
 *  - SerpAPI (requires SERPAPI_KEY)
 *  - Dummy provider (always available fallback)
 */

export interface WebSearchOptions {
  maxResults?: number;
  providerPreference?: ('bing' | 'serpapi' | 'dummy')[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string; // provider hostname
  publishedAt?: string;
  score?: number; // relevance score (simple heuristic)
}

export class WebSearchClient {
  private bingKey?: string;
  private serpApiKey?: string;

  constructor() {
    this.bingKey = process.env.BING_SEARCH_API_KEY;
    this.serpApiKey = process.env.SERPAPI_KEY;
  }

  async search(query: string, options: WebSearchOptions = {}): Promise<WebSearchResult[]> {
    const providers = options.providerPreference || ['bing', 'serpapi', 'dummy'];
    const maxResults = options.maxResults || 5;
    const errors: string[] = [];

    for (const provider of providers) {
      try {
        if (provider === 'bing' && this.bingKey) {
          const results = await this.searchBing(query, maxResults);
          if (results.length) return results;
        } else if (provider === 'serpapi' && this.serpApiKey) {
          const results = await this.searchSerpApi(query, maxResults);
          if (results.length) return results;
        } else if (provider === 'dummy') {
          return this.dummyResults(query, maxResults);
        }
      } catch (err) {
        errors.push(`${provider}: ${(err as Error).message}`);
      }
    }

    // If all fail, provide dummy data with error context
    return this.dummyResults(query, maxResults, errors);
  }

  private async searchBing(query: string, maxResults: number): Promise<WebSearchResult[]> {
    const endpoint = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
    const resp = await fetch(endpoint, { headers: { 'Ocp-Apim-Subscription-Key': this.bingKey! } });
    if (!resp.ok) throw new Error(`Bing HTTP ${resp.status}`);
    const data = await resp.json();
    const webPages = data.webPages?.value || [];
    return webPages.slice(0, maxResults).map((item: any, idx: number): WebSearchResult => ({
      title: item.name,
      url: item.url,
      snippet: item.snippet,
      source: 'bing',
      publishedAt: item.dateLastCrawled,
      score: (maxResults - idx) / maxResults
    }));
  }

  private async searchSerpApi(query: string, maxResults: number): Promise<WebSearchResult[]> {
    const endpoint = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${this.serpApiKey}`;
    const resp = await fetch(endpoint);
    if (!resp.ok) throw new Error(`SerpAPI HTTP ${resp.status}`);
    const data = await resp.json();
    const organic = data.organic_results || [];
    return organic.slice(0, maxResults).map((item: any, idx: number): WebSearchResult => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || item.snippet_highlighted_words?.join(' ') || '',
      source: 'serpapi',
      publishedAt: item.date || undefined,
      score: (maxResults - idx) / maxResults
    }));
  }

  private dummyResults(query: string, maxResults: number, errors: string[] = []): WebSearchResult[] {
    const templateSnippets = [
      `Overview of current trends related to "${query}" in capital markets.`,
      `AI adoption insights and analytics approaches impacting ${query}.`,
      `Regulatory and compliance considerations influencing ${query}.`,
      `Competitive landscape summary and strategic differentiation for ${query}.`,
      `Opportunities and risks analysis framework for ${query}.`
    ];
    return Array.from({ length: maxResults }).map((_, i) => ({
      title: `Synthetic Research Result ${i + 1} for ${query}`,
      url: `https://example.com/research/${encodeURIComponent(query)}/${i + 1}`,
      snippet: templateSnippets[i % templateSnippets.length],
      source: 'dummy',
      score: (maxResults - i) / maxResults,
      publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
      ...(errors.length && i === 0 ? { errorContext: errors.join('; ') } : {})
    })) as WebSearchResult[];
  }
}
