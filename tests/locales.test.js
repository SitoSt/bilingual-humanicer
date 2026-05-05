/**
 * locales.test.js — Tests for the i18n locale architecture.
 */

import { describe, it, expect } from 'vitest';
import { getLocale } from '../src/locales/index.js';

describe('getLocale', () => {
  it('defaults to Spanish', () => {
    const locale = getLocale();
    expect(locale).toHaveProperty('TIER_1');
    expect(locale.TIER_1).toContain('fundamental');
  });

  it('returns English vocab for lang=en', () => {
    const locale = getLocale('en');
    expect(locale.TIER_1).toContain('delve');
    expect(locale.TIER_1).not.toContain('fundamental');
  });

  it('returns Spanish vocab for lang=es', () => {
    const locale = getLocale('es');
    expect(locale.TIER_1).toContain('fundamental');
    expect(locale.TIER_1).not.toContain('delve');
  });

  it('falls back to Spanish for unknown lang', () => {
    const locale = getLocale('fr');
    expect(locale.TIER_1).toContain('fundamental');
  });

  it('each locale exports TIER_1, TIER_2, TIER_3, AI_PHRASES, FUNCTION_WORDS', () => {
    for (const lang of ['en', 'es']) {
      const locale = getLocale(lang);
      expect(locale).toHaveProperty('TIER_1');
      expect(locale).toHaveProperty('TIER_2');
      expect(locale).toHaveProperty('TIER_3');
      expect(locale).toHaveProperty('AI_PHRASES');
      expect(locale).toHaveProperty('FUNCTION_WORDS');
    }
  });
});