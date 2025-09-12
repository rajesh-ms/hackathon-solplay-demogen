import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { WebSearchClient, WebSearchResult } from './web-search';

export interface LocalDataRecord {
  id: string;
  title: string;
  content: string;
  metadata?: any;
}

export interface ResearchReport {
  id: string;
  topic: string;
  generatedAt: string;
  localDataSummary: string;
  webFindings: WebSearchResult[];
  comparativeInsights: string[];
  opportunities: string[];
  risks: string[];
  recommendedActions: string[];
  sources: { title: string; url: string }[];
  meta: {
    provider: string;
    modelUsed: string | 'fallback';
    localDocs: number;
    tokensApprox: number;
    durationMs: number;
    syntheticFallback: boolean;
  };
}

interface RunParams {
  topic: string;
  localDataIds?: string[]; // references to files in data/extracted
  rawLocalData?: { title: string; content: string }[];
  maxWebResults?: number;
}

export class MarketResearchAgent {
  private openai?: OpenAI;
  private webSearch: WebSearchClient;
  private dataDir: string;

  constructor(baseDataDir: string) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    this.webSearch = new WebSearchClient();
    this.dataDir = path.join(baseDataDir, 'market-research');
  }

  async run(params: RunParams): Promise<ResearchReport> {
    const start = Date.now();
    await fs.mkdir(this.dataDir, { recursive: true });

    const localRecords = await this.loadLocalData(params.localDataIds, params.rawLocalData);
    const webResults = await this.webSearch.search(params.topic, { maxResults: params.maxWebResults || 5 });

    const localSummary = this.basicSummarize(localRecords, 1200);
    let report: ResearchReport;
    let syntheticFallback = false;
    let modelUsed: string | 'fallback' = 'fallback';
    let comparativeInsights: string[] = [];
    let opportunities: string[] = [];
    let risks: string[] = [];
    let recommended: string[] = [];

    if (this.openai) {
      try {
        const prompt = this.buildPrompt(params.topic, localSummary, webResults);
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are a senior financial markets research analyst. Provide concise, insight-driven output.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.35,
            max_tokens: 1200
        });
        const content = completion.choices[0]?.message?.content || '';
        modelUsed = 'gpt-4';
        const parsed = this.tryParseJSON(content);
        if (parsed) {
          comparativeInsights = parsed.comparativeInsights || [];
          opportunities = parsed.opportunities || [];
          risks = parsed.risks || [];
          recommended = parsed.recommendedActions || parsed.recommended || [];
        } else {
          // fallback to heuristic extraction from raw content
          comparativeInsights = this.extractBulletSection(content, 'comparative') || [];
          opportunities = this.extractBulletSection(content, 'opportun') || [];
          risks = this.extractBulletSection(content, 'risk') || [];
          recommended = this.extractBulletSection(content, 'recommend') || [];
        }
      } catch (err) {
        syntheticFallback = true;
      }
    } else {
      syntheticFallback = true;
    }

    if (syntheticFallback) {
      const synth = this.syntheticInsights(params.topic, localSummary, webResults);
      comparativeInsights = synth.comparativeInsights;
      opportunities = synth.opportunities;
      risks = synth.risks;
      recommended = synth.recommendedActions;
    }

    report = {
      id: uuidv4(),
      topic: params.topic,
      generatedAt: new Date().toISOString(),
      localDataSummary: localSummary,
      webFindings: webResults,
      comparativeInsights,
      opportunities,
      risks,
      recommendedActions: recommended,
      sources: webResults.map(r => ({ title: r.title, url: r.url })),
      meta: {
        provider: webResults[0]?.source || 'unknown',
        modelUsed,
        localDocs: localRecords.length,
        tokensApprox: Math.round((localSummary.length + webResults.map(r=>r.snippet).join(' ').length) / 4),
        durationMs: Date.now() - start,
        syntheticFallback
      }
    };

    await fs.writeFile(path.join(this.dataDir, `${report.id}.json`), JSON.stringify(report, null, 2));
    return report;
  }

  private async loadLocalData(ids?: string[], raw?: { title: string; content: string }[]): Promise<LocalDataRecord[]> {
    const records: LocalDataRecord[] = [];
    if (ids?.length) {
      const extractedDir = path.join(path.dirname(this.dataDir), 'extracted');
      for (const id of ids) {
        const filePath = path.join(extractedDir, `${id}.json`);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const json = JSON.parse(content);
            records.push({ id, title: json.originalName || id, content: JSON.stringify(json.useCases || json).slice(0, 4000) });
        } catch {
          // ignore missing
        }
      }
    }
    if (raw?.length) {
      raw.forEach((r, i) => records.push({ id: `raw-${i}`, title: r.title, content: r.content.slice(0, 4000) }));
    }
    return records;
  }

  private basicSummarize(records: LocalDataRecord[], maxChars: number): string {
    if (!records.length) return 'No local documents provided.';
    const combined = records.map(r => `TITLE: ${r.title}\n${r.content}`).join('\n---\n');
    return combined.length > maxChars ? combined.slice(0, maxChars) + '...' : combined;
  }

  private buildPrompt(topic: string, localSummary: string, web: WebSearchResult[]): string {
    return `Topic: ${topic}\n\nLOCAL DATA SUMMARY (truncated):\n${localSummary}\n\nWEB SEARCH RESULTS:\n${web.map((w,i)=>`${i+1}. ${w.title} | ${w.url}\nSnippet: ${w.snippet}`).join('\n')}\n\nTASK: Produce JSON with keys: comparativeInsights[], opportunities[], risks[], recommendedActions[]. Insights must be specific to capital markets / financial services context if applicable.`;
  }

  private tryParseJSON(content: string): any | null {
    try { return JSON.parse(content); } catch { return null; }
  }

  private extractBulletSection(text: string, keyword: string): string[] | null {
    const lines = text.split(/\n|\r/).filter(l => l.toLowerCase().includes(keyword));
    if (!lines.length) return null;
    return lines.slice(0, 8).map(l => l.replace(/^[-*\d.\s]+/, '').trim());
  }

  private syntheticInsights(topic: string, localSummary: string, web: WebSearchResult[]) {
    const signals = web.slice(0,3).map(r => r.snippet);
    return {
      comparativeInsights: [
        `Local materials emphasize structured capabilities; external sources highlight dynamic data integration for ${topic}.`,
        `Market commentary suggests increased AI-driven analytics adoption; internal content focuses on foundational automation.`,
        `Competitive differentiation emerging around real-time risk intelligence layered onto ${topic} workflows.`
      ],
      opportunities: [
        `Expand offering with real-time alternative data ingestion relevant to ${topic}.`,
        `Productize internal knowledge as packaged analytics accelerators.`,
        `Leverage AI summarization to reduce analyst cycle times by 50% for ${topic} research.`
      ],
      risks: [
        'Data provenance & regulatory scrutiny on third-party data sources.',
        'Model drift impacting analytical accuracy over time.',
        'Operational siloing if insights are not embedded into decision systems.'
      ],
      recommendedActions: [
        'Implement governance layer for external data source validation.',
        'Pilot LLM-based synthesis on 3 high-impact analyst workflows.',
        'Define KPI framework: time-to-insight, coverage breadth, alpha retention.'
      ],
      signals
    };
  }
}
