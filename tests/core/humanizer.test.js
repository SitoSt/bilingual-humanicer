// tests/core/humanizer.test.js
import { describe, it, expect } from 'vitest';
import { humanize, humanizeResult, autoFix } from '../../src/core/humanizer.js';
import { analyze } from '../../src/core/analyzer.js';

const AI_TEXT_EN = `Furthermore, it is important to note that this comprehensive solution
leverages cutting-edge methodologies to showcase transformative impact across diverse ecosystems.
In conclusion, it is worth mentioning that the robust framework facilitates seamless integration.`;

describe('humanize', () => {
  it('returns required data fields', () => {
    const result = humanize(AI_TEXT_EN, { lang: 'en' });
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('critical');
    expect(result).toHaveProperty('important');
    expect(result).toHaveProperty('minor');
    expect(result).toHaveProperty('guidance');
    expect(result).toHaveProperty('styleTips');
    expect(result).toHaveProperty('analysis');
  });

  it('guidance is an array of strings', () => {
    const result = humanize(AI_TEXT_EN, { lang: 'en' });
    expect(Array.isArray(result.guidance)).toBe(true);
    result.guidance.forEach((tip) => expect(typeof tip).toBe('string'));
  });

  it('autofix returns fixed text when enabled', () => {
    const result = humanize('He said \u201Chello\u201D.', { lang: 'en', autofix: true });
    expect(result.autofix).not.toBeNull();
    expect(result.autofix.text).toContain('"hello"');
  });

  it('autofix is null when not enabled', () => {
    const result = humanize(AI_TEXT_EN, { lang: 'en' });
    expect(result.autofix).toBeNull();
  });

  it('analysis field contains the full AnalysisResult', () => {
    const result = humanize(AI_TEXT_EN, { lang: 'en' });
    expect(result.analysis).toHaveProperty('score');
    expect(result.analysis).toHaveProperty('findings');
  });
});

describe('humanizeResult', () => {
  it('accepts pre-computed analysis and returns same shape', () => {
    const analysis = analyze(AI_TEXT_EN, { lang: 'en', verbose: true });
    const result = humanizeResult(analysis, { lang: 'en' });
    expect(result.score).toBe(analysis.score);
    expect(Array.isArray(result.critical)).toBe(true);
    expect(result.analysis).toBe(analysis);
  });
});

describe('autoFix', () => {
  it('replaces curly quotes', () => {
    const { text, fixes } = autoFix('\u201Chello\u201D');
    expect(text).toBe('"hello"');
    expect(fixes.length).toBeGreaterThan(0);
  });

  it('removes chatbot opening artifact', () => {
    const { text, fixes } = autoFix('Great question! Now let me explain.');
    expect(text).not.toContain('Great question!');
    expect(fixes.some(f => f.includes('chatbot'))).toBe(true);
  });

  it('simplifies filler phrases', () => {
    const { text } = autoFix('We need to utilize this in order to proceed.');
    expect(text).toContain('use');
    expect(text).toContain('to proceed');
  });
});
