// tests/formatters/suggestions.test.js
import { describe, it, expect } from 'vitest';
import {
  formatGroupedSuggestions,
  formatSuggestions,
  formatGuidance,
  formatStyleTips,
} from '../../src/formatters/suggestions.js';
import { humanize } from '../../src/core/humanizer.js';

const result = humanize(
  'Furthermore, it is important to note the comprehensive impact showcasing transformative change.',
  { lang: 'en' },
);

describe('formatGroupedSuggestions', () => {
  it('returns a non-empty string', () => {
    const output = formatGroupedSuggestions(result);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('contains no ANSI escape codes', () => {
    // eslint-disable-next-line no-control-regex
    expect(formatGroupedSuggestions(result)).not.toMatch(/\x1b\[/);
  });
});

describe('formatSuggestions', () => {
  it('returns a string', () => {
    expect(typeof formatSuggestions(result)).toBe('string');
  });

  it('returns no-patterns message for clean result', () => {
    const clean = humanize('I went to the shop.', { lang: 'en' });
    expect(formatSuggestions(clean)).toContain('No significant');
  });
});

describe('formatGuidance', () => {
  it('numbers the tips', () => {
    if (result.guidance.length > 0) {
      expect(formatGuidance(result)).toContain('1.');
    }
  });

  it('returns empty string when no guidance', () => {
    expect(formatGuidance({ guidance: [] })).toBe('');
  });
});

describe('formatStyleTips', () => {
  it('returns empty string when no style tips', () => {
    expect(formatStyleTips({ styleTips: [] })).toBe('');
  });
});
