import { describe, it, expect } from 'vitest';
import { stripCodeSnippets, wordCount, scoreLabel, burstinessLabel, ttrLabel, reliabilityLabel } from '../../src/core/utils.js';

describe('stripCodeSnippets', () => {
  it('masks fenced code blocks preserving line count', () => {
    const input = 'before\n```\ncode\n```\nafter';
    const result = stripCodeSnippets(input);
    expect(result.split('\n')).toHaveLength(5);
    expect(result).not.toContain('code');
    expect(result).toContain('before');
  });
});

describe('wordCount', () => {
  it('counts words correctly', () => {
    expect(wordCount('one two three')).toBe(3);
  });
});

describe('scoreLabel', () => {
  it('returns correct label for each range', () => {
    expect(scoreLabel(10)).toBe('Mostly human-sounding');
    expect(scoreLabel(30)).toBe('Lightly AI-touched');
    expect(scoreLabel(55)).toBe('Moderately AI-influenced');
    expect(scoreLabel(80)).toBe('Heavily AI-generated');
  });
});

describe('burstinessLabel', () => {
  it('labels high burstiness as human-like', () => {
    expect(burstinessLabel(0.8)).toContain('human-like');
  });
});

describe('ttrLabel', () => {
  it('marks short texts as too short to assess', () => {
    expect(ttrLabel(0.5, 50)).toContain('too short');
  });
});

describe('reliabilityLabel', () => {
  it('returns correct label', () => {
    expect(reliabilityLabel('high')).toBe('High confidence');
    expect(reliabilityLabel('low')).toBe('Low confidence');
  });
});
