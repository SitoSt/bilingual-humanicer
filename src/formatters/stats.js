'use strict';

const { burstinessLabel, ttrLabel } = require('../core/utils');
const { formatReadabilityLine } = require('./report');

/**
 * Format stats object as plain text report (no ANSI).
 * Handles both EN (fleschKincaid) and ES (ifsz/hlr/connectorDensity) stats.
 * Never prints "null" for any readability metric.
 */
function formatStatsReport(stats) {
  const lines = [];
  lines.push('');
  lines.push('── Text Statistics ─────────────────────────────────');
  lines.push('');
  lines.push('  ── Sentences ──────────────────────────────────');
  lines.push(`    Count:            ${stats.sentenceCount}`);
  lines.push(`    Avg length:       ${stats.avgSentenceLength} words`);
  lines.push(`    Std deviation:    ${stats.sentenceLengthStdDev}`);
  lines.push(`    Burstiness:       ${stats.burstiness}  ${burstinessLabel(stats.burstiness)}`);
  lines.push('');
  lines.push('  ── Vocabulary ─────────────────────────────────');
  lines.push(`    Total words:      ${stats.wordCount}`);
  if (stats.uniqueWordCount !== undefined) {
    lines.push(`    Unique words:     ${stats.uniqueWordCount}`);
  }
  lines.push(
    `    Type-token ratio: ${stats.typeTokenRatio}  ${ttrLabel(stats.typeTokenRatio, stats.wordCount)}`,
  );
  if (stats.avgWordLength !== undefined) lines.push(`    Avg word length:  ${stats.avgWordLength}`);
  lines.push('');
  lines.push('  ── Structure ──────────────────────────────────');
  lines.push(`    Paragraphs:       ${stats.paragraphCount}`);
  if (stats.avgParagraphLength !== undefined) {
    lines.push(`    Avg para length:  ${stats.avgParagraphLength} words`);
  }
  lines.push(`    Trigram repeat:   ${stats.trigramRepetition}`);
  lines.push('');
  lines.push('  ── Readability ────────────────────────────────');
  const readLine = formatReadabilityLine(stats);
  if (readLine) lines.push(`    ${readLine}`);
  if (stats.hlr !== null && stats.hlr !== undefined) {
    lines.push(`    HLR:              ${stats.hlr}`);
  }
  if (stats.connectorDensity !== null && stats.connectorDensity !== undefined) {
    lines.push(`    Connector density: ${stats.connectorDensity}`);
  }
  lines.push(
    `    Function words:   ${stats.functionWordRatio} (${(stats.functionWordRatio * 100).toFixed(1)}%)`,
  );
  lines.push('');

  return lines.join('\n');
}

module.exports = { formatStatsReport };
