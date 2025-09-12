import path from 'path';
import { MarketResearchAgent } from '../src/market-research-agent';

jest.setTimeout(15000);

describe('MarketResearchAgent', () => {
  const agent = new MarketResearchAgent(path.join(__dirname, '../../data'));

  it('produces a synthetic report without API keys', async () => {
    const report = await agent.run({ topic: 'synthetic capital markets analytics', maxWebResults: 2 });
    expect(report.topic).toMatch(/capital markets/);
    expect(report.webFindings.length).toBeGreaterThan(0);
    expect(Array.isArray(report.comparativeInsights)).toBe(true);
  });
});
