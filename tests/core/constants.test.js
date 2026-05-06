import { describe, it, expect } from 'vitest';
import { DEFAULT_LANG, SCORE_THRESHOLDS, CATEGORY_LABELS, scoreLabel } from '../../src/constants.js';

describe('constants', () => {
  it('DEFAULT_LANG is es', () => {
    expect(DEFAULT_LANG).toBe('es');
  });

  it('SCORE_THRESHOLDS covers all four levels with max values', () => {
    expect(SCORE_THRESHOLDS.HUMAN.max).toBe(19);
    expect(SCORE_THRESHOLDS.LIGHT.max).toBe(44);
    expect(SCORE_THRESHOLDS.MODERATE.max).toBe(69);
    expect(SCORE_THRESHOLDS.HEAVY.max).toBe(100);
    expect(SCORE_THRESHOLDS.HEAVY.label).toBe('Heavily AI-generated');
  });

  it('CATEGORY_LABELS has five entries', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(5);
    expect(CATEGORY_LABELS.content).toBe('Content patterns');
  });

  describe('scoreLabel', () => {
    it('returns correct label at boundary values', () => {
      expect(scoreLabel(0)).toBe('Mostly human-sounding');
      expect(scoreLabel(19)).toBe('Mostly human-sounding');
      expect(scoreLabel(20)).toBe('Lightly AI-touched');
      expect(scoreLabel(44)).toBe('Lightly AI-touched');
      expect(scoreLabel(45)).toBe('Moderately AI-influenced');
      expect(scoreLabel(69)).toBe('Moderately AI-influenced');
      expect(scoreLabel(70)).toBe('Heavily AI-generated');
      expect(scoreLabel(100)).toBe('Heavily AI-generated');
    });
  });
});
