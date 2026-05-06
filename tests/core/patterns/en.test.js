/**
 * en.test.js — Tests for pattern creation and language filtering.
 */

import { describe, it, expect } from 'vitest';
import { createPatterns, wordCount, findMatches } from '../../../src/core/patterns/index.js';

describe('createPatterns', () => {
  it('returns English patterns for lang=en', () => {
    const patterns = createPatterns('en');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toHaveProperty('id');
    expect(patterns[0]).toHaveProperty('detect');
  });

  it('returns Spanish patterns for lang=es', () => {
    const patterns = createPatterns('es');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => String(p.id).startsWith('ES-'))).toBe(true);
  });

  it('defaults to Spanish patterns', () => {
    const patterns = createPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('each English pattern has langs property', () => {
    const patterns = createPatterns('en');
    for (const p of patterns) {
      expect(p).toHaveProperty('langs');
      expect(Array.isArray(p.langs)).toBe(true);
    }
  });

  it('English patterns langs contains "en"', () => {
    const patterns = createPatterns('en');
    for (const p of patterns) {
      expect(p.langs).toContain('en');
    }
  });
});

describe('wordCount', () => {
  it('counts words correctly', () => {
    expect(wordCount('Hello world')).toBe(2);
    expect(wordCount('One two three four five')).toBe(5);
  });

  it('handles empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('handles multiple spaces', () => {
    expect(wordCount('Hello    world')).toBe(2);
  });
});

describe('findMatches', () => {
  it('returns matches with location info', () => {
    const results = findMatches('Hello world, hello world.', /hello/gi, 'test');
    expect(results.length).toBe(2);
    expect(results[0]).toHaveProperty('match');
    expect(results[0]).toHaveProperty('index');
    expect(results[0]).toHaveProperty('line');
    expect(results[0]).toHaveProperty('column');
  });

  it('handles no matches', () => {
    const results = findMatches('Hello world', /xyz/gi, 'test');
    expect(results).toEqual([]);
  });

  it('handles multiline text', () => {
    const text = 'First line.\nSecond line.\nThird line.';
    const results = findMatches(text, /line/gi, 'test');
    expect(results.length).toBe(3);
    expect(results[0].line).toBe(1);
    expect(results[1].line).toBe(2);
    expect(results[2].line).toBe(3);
  });
});
