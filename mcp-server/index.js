#!/usr/bin/env node
/**
 * Humanizer MCP Server
 *
 * Exposes AI writing detection and humanization tools via Model Context Protocol.
 * Works with Claude Desktop, ChatGPT, VS Code, and other MCP clients.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { version } = require(join(__dirname, '..', 'package.json'));

const { analyze, score } = await import('../src/core/analyzer.js');
const { humanize } = await import('../src/core/humanizer.js');
const { computeStats } = await import('../src/core/stats.js');

const LANG_PARAM = {
  type: 'string',
  description: "Language: 'es' (Spanish, default) or 'en' (English)",
  enum: ['es', 'en'],
  default: 'es',
};

const server = new Server(
  { name: 'humanizer', version },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'score',
      description:
        'Quick AI score (0-100). Higher = more AI-like. Returns score, badge and label.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to analyze' },
          lang: LANG_PARAM,
        },
        required: ['text'],
      },
    },
    {
      name: 'analyze',
      description:
        'Full AI writing analysis: pattern matches, category breakdown, statistical signals (burstiness, TTR, readability).',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to analyze' },
          lang: LANG_PARAM,
          verbose: {
            type: 'boolean',
            description: 'Include all pattern matches, not just top 5 (default: false)',
            default: false,
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'humanize',
      description:
        'Suggestions to make text sound more human, grouped by priority (critical, important, guidance). Optionally applies safe mechanical fixes.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to humanize' },
          lang: LANG_PARAM,
          autofix: {
            type: 'boolean',
            description: 'Apply safe mechanical fixes automatically (default: false)',
            default: false,
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'stats',
      description:
        'Statistical analysis only: burstiness, type-token ratio, sentence variation, trigram repetition, readability. No pattern matching.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to analyze statistically' },
          lang: LANG_PARAM,
        },
        required: ['text'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const lang = args.lang || 'es';

  try {
    switch (name) {
      case 'score': {
        const s = score(args.text, { lang });
        const badge = s <= 25 ? '🟢' : s <= 50 ? '🟡' : s <= 75 ? '🟠' : '🔴';
        const label =
          s <= 25
            ? 'Mostly human-sounding'
            : s <= 50
              ? 'Lightly AI-touched'
              : s <= 75
                ? 'Moderately AI-influenced'
                : 'Heavily AI-generated';
        return {
          content: [{ type: 'text', text: `${badge} **${s}/100** — ${label}` }],
        };
      }

      case 'analyze': {
        const result = analyze(args.text, {
          lang,
          verbose: args.verbose || false,
          includeStats: true,
        });

        let output = `## AI Analysis\n\n`;
        output += `**Score:** ${result.score}/100  `;
        output += `**Reliability:** ${result.reliability?.level || 'N/A'}\n`;
        output += `**Pattern Score:** ${result.patternScore}/100  `;
        output += `**Uniformity Score:** ${result.uniformityScore}/100\n\n`;

        if (result.categories) {
          const active = Object.entries(result.categories).filter(([, d]) => d.count > 0);
          if (active.length > 0) {
            output += `### Category Breakdown\n`;
            for (const [cat, data] of active) {
              output += `- **${cat}:** ${data.count} issue${data.count > 1 ? 's' : ''}\n`;
            }
            output += '\n';
          }
        }

        if (result.stats) {
          const s = result.stats;
          output += `### Statistical Signals\n`;
          output += `- Burstiness: ${s.burstiness?.toFixed(2) ?? 'N/A'} _(human >0.6, AI <0.35)_\n`;
          output += `- Type-Token Ratio: ${s.typeTokenRatio?.toFixed(2) ?? 'N/A'} _(human 0.5–0.7)_\n`;
          output += `- Sentence CoV: ${s.sentenceCoV?.toFixed(2) ?? 'N/A'} _(human 0.4–0.8)_\n`;
          if (lang === 'es' && s.ifsz != null) {
            output += `- IFSZ (legibilidad): ${s.ifsz.toFixed(1)} _(humano 60–85, IA 50–65)_\n`;
          }
          if (lang === 'en' && s.fleschKincaid != null) {
            output += `- Flesch-Kincaid: ${s.fleschKincaid.toFixed(1)} _(AI tends to 8–12)_\n`;
          }
          if (lang === 'es' && s.connectorDensity != null) {
            output += `- Connector density: ${s.connectorDensity.toFixed(2)} _(human 0.2–0.3, AI >0.4)_\n`;
          }
        }

        if (result.findings?.length > 0) {
          output += `\n### Pattern Matches\n`;
          const findings = args.verbose ? result.findings : result.findings.slice(0, 5);
          for (const f of findings) {
            output += `- **${f.pattern}** (weight: ${f.weight}): "${f.matches?.[0] ?? ''}"\n`;
          }
          if (!args.verbose && result.findings.length > 5) {
            output += `\n_...and ${result.findings.length - 5} more. Use verbose: true to see all._\n`;
          }
        }

        return { content: [{ type: 'text', text: output }] };
      }

      case 'humanize': {
        const suggestions = humanize(args.text, { lang, autofix: args.autofix || false });

        let output = `## Humanization Suggestions\n\n`;

        if (suggestions.critical?.length > 0) {
          output += `### 🔴 Critical\n`;
          for (const s of suggestions.critical) output += `- ${s}\n`;
          output += '\n';
        }

        if (suggestions.important?.length > 0) {
          output += `### 🟠 Important\n`;
          for (const s of suggestions.important) output += `- ${s}\n`;
          output += '\n';
        }

        if (suggestions.guidance?.length > 0) {
          output += `### 🟡 Guidance\n`;
          for (const s of suggestions.guidance.slice(0, 5)) output += `- ${s}\n`;
          output += '\n';
        }

        if (!suggestions.critical?.length && !suggestions.important?.length) {
          output += `_No significant AI patterns detected._\n`;
        }

        if (args.autofix && suggestions.autofix?.text) {
          output += `### ✅ Auto-fixed Text\n\n${suggestions.autofix.text}\n`;
          if (suggestions.autofix.fixes?.length > 0) {
            output += `\n_${suggestions.autofix.fixes.length} fix${suggestions.autofix.fixes.length > 1 ? 'es' : ''} applied._\n`;
          }
        }

        return { content: [{ type: 'text', text: output }] };
      }

      case 'stats': {
        const s = computeStats(args.text, lang);

        let output = `## Statistical Analysis\n\n`;
        output += `| Metric | Value | Human range | AI range |\n`;
        output += `| --- | --- | --- | --- |\n`;
        output += `| Burstiness | ${s.burstiness?.toFixed(3) ?? 'N/A'} | 0.5–1.0 | 0.1–0.3 |\n`;
        output += `| Type-Token Ratio | ${s.typeTokenRatio?.toFixed(3) ?? 'N/A'} | 0.5–0.7 | 0.3–0.5 |\n`;
        output += `| Sentence CoV | ${s.sentenceCoV?.toFixed(3) ?? 'N/A'} | 0.4–0.8 | 0.15–0.35 |\n`;
        output += `| Trigram repetition | ${s.trigramRepetition?.toFixed(3) ?? 'N/A'} | <0.05 | >0.10 |\n`;

        if (lang === 'es' && s.ifsz != null) {
          output += `| IFSZ (legibilidad) | ${s.ifsz.toFixed(1)} | 60–85 | 50–65 |\n`;
        }
        if (lang === 'en' && s.fleschKincaid != null) {
          output += `| Flesch-Kincaid | ${s.fleschKincaid.toFixed(1)} | varies | 8–12 |\n`;
        }
        if (lang === 'es' && s.connectorDensity != null) {
          output += `| Connector density | ${s.connectorDensity.toFixed(3)} | 0.2–0.3 | >0.4 |\n`;
        }

        return { content: [{ type: 'text', text: output }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Humanizer MCP server v${version} running on stdio`);
}

main().catch(console.error);
