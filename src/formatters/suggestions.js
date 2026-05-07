// src/formatters/suggestions.js
'use strict';

/**
 * Format as simple flat list (no ANSI).
 */
function formatSuggestions(result) {
  const lines = [];
  const all = [...result.critical, ...result.important, ...result.minor];
  if (all.length === 0) {
    lines.push('No significant AI patterns detected.');
    return lines.join('\n');
  }
  for (const item of all) {
    lines.push(`[${item.patternId}] ${item.pattern}: "${item.text}"`);
    if (item.suggestion) lines.push(`  → ${item.suggestion}`);
  }
  return lines.join('\n');
}

/**
 * Format as grouped list by priority (no ANSI).
 */
function formatGroupedSuggestions(result) {
  const all = [...result.critical, ...result.important, ...result.minor];
  if (all.length === 0) {
    return 'No significant AI patterns detected.';
  }
  const lines = [];
  lines.push('');
  lines.push('── Suggestions ─────────────────────────────────────');

  const sections = [
    { label: 'Critical (weight 4-5)', items: result.critical },
    { label: 'Important (weight 2-3)', items: result.important },
    { label: 'Minor (weight 1)',       items: result.minor },
  ];

  for (const { label, items } of sections) {
    if (items.length === 0) continue;
    lines.push('');
    lines.push(`  ${label}:`);
    for (const item of items) {
      lines.push(`    [${item.patternId}] L${item.line || '?'}: "${item.text}"`);
      if (item.suggestion) lines.push(`      → ${item.suggestion}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Format guidance tips as numbered plain text.
 */
function formatGuidance(result) {
  if (!result.guidance || result.guidance.length === 0) return '';
  return result.guidance.map((tip, i) => `${i + 1}. ${tip}`).join('\n');
}

/**
 * Format style tips as numbered plain text.
 */
function formatStyleTips(result) {
  if (!result.styleTips || result.styleTips.length === 0) return '';
  return result.styleTips.map((tip, i) => `${i + 1}. ${typeof tip === 'string' ? tip : tip.tip}`).join('\n');
}

module.exports = { formatSuggestions, formatGroupedSuggestions, formatGuidance, formatStyleTips };
