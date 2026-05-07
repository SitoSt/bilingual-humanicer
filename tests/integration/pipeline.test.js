// tests/integration/pipeline.test.js
import { describe, it, expect } from 'vitest';
import { analyze } from '../../src/core/analyzer.js';
import { humanize } from '../../src/core/humanizer.js';
import {
  buildSummary,
  formatText,
  formatMarkdown,
  formatJSON,
} from '../../src/formatters/report.js';
import { formatGroupedSuggestions } from '../../src/formatters/suggestions.js';
import { computeStats } from '../../src/core/stats.js';
import { formatStatsReport } from '../../src/formatters/stats.js';

const AI_ES = `En conclusión, es importante destacar que este análisis exhaustivo demuestra
claramente el impacto transformador. Cabe señalar que los expertos sugieren implementar
mejores prácticas, aprovechando las oportunidades, generando valor, facilitando el crecimiento.`;

const HUMAN_ES = `Fui al mercado el martes. Compré tres kilos de tomates y cebollas.
El vendedor me hizo un descuento porque era tarde. Volví en bici aunque llovía.`;

describe('full pipeline — Spanish', () => {
  it('analyze → formatText produces no ANSI codes', () => {
    const result = analyze(AI_ES, { lang: 'es' });
    const output = formatText(result);
    // eslint-disable-next-line no-control-regex
    expect(output).not.toMatch(/\x1b\[/);
    expect(output).toContain('Score:');
  });

  it('analyze → formatMarkdown is valid markdown', () => {
    const result = analyze(AI_ES, { lang: 'es' });
    const md = formatMarkdown(result);
    expect(md).toMatch(/^# AI writing/);
  });

  it('analyze → formatJSON is parseable', () => {
    const result = analyze(AI_ES, { lang: 'es' });
    expect(() => JSON.parse(formatJSON(result))).not.toThrow();
  });

  it('analyze → buildSummary contains score', () => {
    const result = analyze(AI_ES, { lang: 'es' });
    expect(buildSummary(result)).toContain(`${result.score}/100`);
  });

  it('humanize → formatGroupedSuggestions produces string', () => {
    const result = humanize(AI_ES, { lang: 'es' });
    const output = formatGroupedSuggestions(result);
    expect(typeof output).toBe('string');
  });

  it('AI text scores higher than human text', () => {
    const aiScore = analyze(AI_ES, { lang: 'es' }).score;
    const humanScore = analyze(HUMAN_ES, { lang: 'es' }).score;
    expect(aiScore).toBeGreaterThan(humanScore);
  });
});

describe('full pipeline — English', () => {
  const AI_EN = `Furthermore, it is important to note that this comprehensive analysis
clearly showcases the transformative impact. In conclusion, leveraging cutting-edge
methodologies facilitates seamless integration across diverse ecosystems.`;

  it('analyze scores AI text > 40', () => {
    expect(analyze(AI_EN, { lang: 'en' }).score).toBeGreaterThan(40);
  });

  it('stats pipeline works end-to-end', () => {
    const stats = computeStats(AI_EN, 'en');
    const report = formatStatsReport(stats);
    expect(report).not.toContain('null');
    expect(report).toContain('words');
  });
});
