import { describe, it, expect } from 'vitest';
import {
  findMatches,
  countMatches,
  wordCount,
  scanWordList,
  scanPhrases,
} from '../../../src/core/patterns/helpers.js';

describe('findMatches', () => {
  it('returns line and column numbers', () => {
    const matches = findMatches('hello world\nfoo bar', /world/, 'test');
    expect(matches).toHaveLength(1);
    expect(matches[0].line).toBe(1);
    expect(matches[0].column).toBe(7);
    expect(matches[0].match).toBe('world');
  });
  it('calls suggestion function with matched text', () => {
    const matches = findMatches('hello', /hello/, (m) => `fix: ${m}`);
    expect(matches[0].suggestion).toBe('fix: hello');
  });
});
describe('countMatches', () => {
  it('counts all occurrences', () => {
    expect(countMatches('a b a c a', /a/g)).toBe(3);
  });
});
describe('wordCount', () => {
  it('counts space-separated tokens', () => {
    expect(wordCount('one two three')).toBe(3);
  });
  it('trims whitespace', () => {
    expect(wordCount('  one  ')).toBe(1);
  });
});
describe('scanWordList', () => {
  it('finds all words from list', () => {
    const results = scanWordList('delve into tapestry', ['delve', 'tapestry'], 'AI word');
    expect(results).toHaveLength(2);
  });
});
describe('scanPhrases', () => {
  it('finds phrase and attaches fix', () => {
    const results = scanPhrases('in order to succeed', [
      { pattern: /in order to/gi, tier: 1, fix: 'to' },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].suggestion).toContain('to');
  });
});
