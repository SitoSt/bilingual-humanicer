// src/humanizer.js — SHIM: forwards to core/humanizer.js
// Will be deleted in Task 8.
'use strict';

const { humanize, humanizeResult, autoFix, buildGuidance, buildStyleTips } = require('./core/humanizer');
const {
  formatGroupedSuggestions,
} = require('./formatters/suggestions');

// ─── Legacy rich formatSuggestions (backward compat) ─────
// The new formatters/suggestions.js has a simple flat-list version.
// This rich terminal version is kept here for consumers that depend on the
// old output format (e.g. tests/humanizer.test.js).

function truncate(str, len) {
  if (typeof str !== 'string') return '';
  return str.length > len ? `${str.substring(0, len)}...` : str;
}

function formatReliabilityLabel(level) {
  if (level === 'high') return 'High confidence';
  if (level === 'medium') return 'Medium confidence';
  return 'Low confidence';
}

function formatSuggestions(result) {
  const lines = [];

  lines.push('');
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║           HUMANIZATION SUGGESTIONS               ║');
  lines.push('╚══════════════════════════════════════════════════╝');
  lines.push('');

  const filled = Math.round(result.score / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  lines.push(`  AI Score: ${result.score}/100  [${bar}]`);
  lines.push(
    `  Issues: ${result.totalIssues}  |  Pattern: ${result.patternScore}  |  Uniformity: ${result.uniformityScore}`,
  );
  if (result.reliability) {
    lines.push(
      `  Confidence: ${formatReliabilityLabel(result.reliability.level)} (${result.reliability.score}/100)`,
    );
  }
  lines.push('');

  if (result.critical.length > 0) {
    lines.push('── CRITICAL (dead giveaways) ───────────────────────');
    for (const s of result.critical) {
      lines.push(`  L${s.line}: [${s.pattern}] "${truncate(s.text, 60)}" [${s.confidence}]`);
      lines.push(`       → ${s.suggestion}`);
    }
    lines.push('');
  }

  if (result.important.length > 0) {
    lines.push('── IMPORTANT (noticeable patterns) ─────────────────');
    for (const s of result.important.slice(0, 15)) {
      lines.push(`  L${s.line}: [${s.pattern}] "${truncate(s.text, 60)}"`);
      lines.push(`       → ${s.suggestion}`);
    }
    if (result.important.length > 15) {
      lines.push(`  ... and ${result.important.length - 15} more`);
    }
    lines.push('');
  }

  if (result.minor.length > 0) {
    lines.push('── MINOR (subtle tells) ────────────────────────────');
    for (const s of result.minor.slice(0, 10)) {
      lines.push(`  L${s.line}: [${s.pattern}] "${truncate(s.text, 60)}"`);
      lines.push(`       → ${s.suggestion}`);
    }
    if (result.minor.length > 10) {
      lines.push(`  ... and ${result.minor.length - 10} more`);
    }
    lines.push('');
  }

  if (result.autofix) {
    lines.push('── AUTO-FIXES APPLIED ──────────────────────────────');
    for (const fix of result.autofix.fixes) {
      lines.push(`  ✓ ${fix}`);
    }
    lines.push('');
  }

  if (result.guidance.length > 0) {
    lines.push('── GUIDANCE ────────────────────────────────────────');
    for (const tip of result.guidance) {
      lines.push(`  • ${tip}`);
    }
    lines.push('');
  }

  if (result.styleTips.length > 0) {
    lines.push('── STYLE TIPS (statistical) ────────────────────────');
    for (const t of result.styleTips) {
      const metric = t.value !== null ? ` [${t.metric}: ${t.value}]` : '';
      lines.push(`  ◦ ${t.tip}${metric}`);
    }
    lines.push('');
  }

  lines.push('════════════════════════════════════════════════════');
  return lines.join('\n');
}

module.exports = {
  humanize,
  humanizeResult,
  autoFix,
  buildGuidance,
  buildStyleTips,
  formatSuggestions,
  formatGroupedSuggestions,
};
