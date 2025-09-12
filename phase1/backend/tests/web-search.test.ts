import { WebSearchClient } from '../src/web-search';

describe('WebSearchClient', () => {
  it('returns dummy results when no keys provided', async () => {
    const client = new WebSearchClient();
    const results = await client.search('test query', { maxResults: 3, providerPreference: ['dummy'] });
    expect(results).toHaveLength(3);
    expect(results[0].title).toContain('test query');
  });
});
