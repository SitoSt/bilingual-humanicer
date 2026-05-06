'use strict';

const { PatternRegistry } = require('./registry');
const { enPatterns } = require('./en');
const esPatterns = require('./es');
const { DEFAULT_LANG } = require('../../constants');
const { wordCount } = require('./helpers');

// Singleton registry populated with EN patterns
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

// Re-export vocabulary for backward-compat consumers
const vocab = require('../../vocabulary');

module.exports = {
  createPatterns,
  PatternRegistry,
  registry,
  patterns: enPatterns,       // backward compat: old consumers do require('./patterns').patterns
  wordCount,                  // backward compat: analyzer.js imports wordCount from patterns
  ...vocab,                   // TIER_1, TIER_2, TIER_3, AI_PHRASES, etc. for backward compat
  // Internal helpers are intentionally NOT exported from the public API
  // (findMatches, countMatches, wordRegex, scanWordList, scanPhrases are in helpers.js)
  // But findMatches IS exported for backward compat (tests/patterns.test.js imports it)
  findMatches: require('./helpers').findMatches,
  countMatches: require('./helpers').countMatches,
  scanWordList: require('./helpers').scanWordList,
  scanPhrases: require('./helpers').scanPhrases,
};
