'use strict';

const { PatternRegistry } = require('./registry');
const { enPatterns } = require('./en');
const esPatterns = require('./es');
const { DEFAULT_LANG } = require('../../constants');
const { wordCount } = require('./helpers');

// Singleton registry populated with EN patterns only.
// NOTE: ES patterns are excluded because they are a separate detection set,
// not an extension of the EN registry. Use createPatterns(lang) to get the
// correct active set for a given language.
const registry = new PatternRegistry();
for (const p of enPatterns) registry.register(p);

function createPatterns(lang = DEFAULT_LANG) {
  if (lang === 'en') {
    return enPatterns
      .filter((p) => p.langs.includes('en'))
      .map((p) => {
        if (p.id === 'PatternEN-7') {
          return { ...p, detect: (text) => p.detect(text, 'en') };
        }
        return p;
      });
  }
  if (lang === 'es') {
    const enPattern7 = enPatterns.find((p) => p.id === 'PatternEN-7');
    return [
      { ...enPattern7, detect: (text) => enPattern7.detect(text, 'es') },
      ...esPatterns,
    ];
  }
  return [];
}

// Backward-compat re-exports for existing consumers (shim period only — removed in Task 8).
// WARNING: vocabulary re-exports are English-only (from vocabulary.js).
// For multilingual vocabulary use getLocale(lang).TIER_1 etc.
const { TIER_1, TIER_2, TIER_3, AI_PHRASES, SIGNIFICANCE_PHRASES, PROMOTIONAL_WORDS,
        VAGUE_ATTRIBUTION_PHRASES, CHALLENGES_PHRASES, COPULA_AVOIDANCE } = require('../../vocabulary');
const { findMatches, countMatches, scanWordList, scanPhrases } = require('./helpers');

module.exports = {
  createPatterns,
  PatternRegistry,
  registry,
  patterns: enPatterns,  // backward compat: consumers that do require('./patterns').patterns
  wordCount,             // backward compat: src/analyzer.js imports wordCount from ./patterns
  // EN-only vocabulary (backward compat — use getLocale(lang) for multilingual):
  TIER_1, TIER_2, TIER_3, AI_PHRASES, SIGNIFICANCE_PHRASES, PROMOTIONAL_WORDS,
  VAGUE_ATTRIBUTION_PHRASES, CHALLENGES_PHRASES, COPULA_AVOIDANCE,
  // Helpers (backward compat for tests that import via the old path):
  findMatches, countMatches, scanWordList, scanPhrases,
};
