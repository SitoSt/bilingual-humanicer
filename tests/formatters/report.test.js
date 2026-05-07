import { describe, it, expect } from 'vitest';
import { buildSummary, formatText, formatMarkdown, formatJSON, formatReadabilityLine } from '../../src/formatters/report.js';
import { analyze } from '../../src/core/analyzer.js';

const sampleResult = analyze(
  'Furthermore, it is important to note that this comprehensive analysis clearly demonstrates the transformative impact.',
  { lang: 'en' }
);

describe('buildSummary', () => {
  it('returns a non-empty string', () => {
    expect(typeof buildSummary(sampleResult)).toBe('string');
    expect(buildSummary(sampleResult).length).toBeGreaterThan(10);
  });

  it('includes the score', () => {
    expect(buildSummary(sampleResult)).toContain(`${sampleResult.score}/100`);
  });

  it('returns human-text message for clean text', () => {
    const clean = analyze('I went to the shop. It was closed. I came back home.', { lang: 'en' });
    expect(buildSummary(clean)).toContain('human-written');
  });
});

describe('formatText', () => {
  it('contains score bar', () => {
    expect(formatText(sampleResult)).toContain('Score:');
    expect(formatText(sampleResult)).toContain('█');
  });

  it('contains no ANSI escape codes', () => {
    expect(formatText(sampleResult)).not.toMatch(/\x1b\[/);
  });
});

describe('formatMarkdown', () => {
  it('starts with markdown heading', () => {
    expect(formatMarkdown(sampleResult)).toMatch(/^# AI writing/);
  });
});

describe('formatJSON', () => {
  it('is valid JSON', () => {
    expect(() => JSON.parse(formatJSON(sampleResult))).not.toThrow();
  });
});

describe('formatReadabilityLine', () => {
  it('returns IFSZ line when ifsz present', () => {
    expect(formatReadabilityLine({ ifsz: 58, fleschKincaid: null })).toBe('IFSZ: 58');
  });

  it('returns FK line when fleschKincaid present', () => {
    expect(formatReadabilityLine({ ifsz: null, fleschKincaid: 9.2 })).toBe('Flesch-Kincaid: 9.2 grade level');
  });

  it('never returns a string containing "null"', () => {
    const result = formatReadabilityLine({ ifsz: null, fleschKincaid: null });
    expect(result).toBeNull();
  });
});
