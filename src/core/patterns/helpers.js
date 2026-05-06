'use strict';

/**
 * helpers.js — Internal pattern detection helpers.
 * These are NOT re-exported from index.js.
 */

/**
 * Find all regex matches with line numbers and columns.
 * Returns [{ match, index, line, column, suggestion, confidence }]
 */
function findMatches(text, regex, suggestion, confidence = 'high') {
  const results = [];
  const lines = text.split('\n');
  let offset = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const lineRegex = new RegExp(
      regex.source,
      regex.flags.includes('g') ? regex.flags : `${regex.flags}g`,
    );
    let m;
    while ((m = lineRegex.exec(line)) !== null) {
      results.push({
        match: m[0],
        index: offset + m.index,
        line: lineNum + 1,
        column: m.index + 1,
        suggestion: typeof suggestion === 'function' ? suggestion(m[0]) : suggestion,
        confidence,
      });
    }
    offset += line.length + 1;
  }
  return results;
}

/** Count regex occurrences. */
function countMatches(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

/** Word count. */
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Build a case-insensitive word-boundary regex for a word.
 * Escapes special regex chars in the word.
 */
function wordRegex(word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // For multi-word phrases, don't use word boundaries on internal spaces
  if (word.includes(' ')) {
    return new RegExp(`\\b${escaped}\\b`, 'gi');
  }
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

/**
 * Scan text for words from a tier list. Returns matches with word-specific suggestions.
 */
function scanWordList(text, wordList, suggestionPrefix, confidence = 'high') {
  const results = [];
  for (const word of wordList) {
    const regex = wordRegex(word);
    const matches = findMatches(
      text,
      regex,
      `${suggestionPrefix}: "${word}". Use a simpler, more specific alternative.`,
      confidence,
    );
    results.push(...matches);
  }
  return results;
}

/**
 * Scan text for AI phrases. Returns matches with phrase-specific fixes.
 */
function scanPhrases(text, phrases, tierFilter = null) {
  const results = [];
  for (const { pattern, tier, fix } of phrases) {
    if (tierFilter !== null && tier !== tierFilter) continue;
    const matches = findMatches(
      text,
      pattern,
      fix.startsWith('(') ? fix : `Replace with: ${fix}`,
      tier === 1 ? 'high' : tier === 2 ? 'medium' : 'low',
    );
    results.push(...matches);
  }
  return results;
}

module.exports = { findMatches, countMatches, wordCount, wordRegex, scanWordList, scanPhrases };
