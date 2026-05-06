import { describe, it, expect } from 'vitest';
import { DEFAULT_LANG, SCORE_THRESHOLDS, CATEGORY_LABELS } from '../../src/constants.js';

describe('constants', () => {
  it('DEFAULT_LANG is es', () => {
    expect(DEFAULT_LANG).toBe('es');
  });

  it('SCORE_THRESHOLDS covers all four levels', () => {
    expect(SCORE_THRESHOLDS.HUMAN.max).toBe(19);
    expect(SCORE_THRESHOLDS.LIGHT.max).toBe(44);
    expect(SCORE_THRESHOLDS.MODERATE.max).toBe(69);
    expect(SCORE_THRESHOLDS.HEAVY.label).toBe('Heavily AI-generated');
  });

  it('CATEGORY_LABELS has five entries', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(5);
    expect(CATEGORY_LABELS.content).toBe('Content patterns');
  });
});
