'use strict';

const { buildSummary, formatMarkdown, formatJSON, formatReadabilityLine } = require('../formatters/report');
const { formatSuggestions, formatGroupedSuggestions } = require('../formatters/suggestions');
const { formatScanReport, formatComparisonReport } = require('../formatters/scan');
const { formatStatsReport } = require('../formatters/stats');

// ─── ANSI color helpers ───────────────────────────────────
const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;

const color = {
  red:     (s) => (supportsColor ? `\x1b[31m${s}\x1b[0m` : s),
  green:   (s) => (supportsColor ? `\x1b[32m${s}\x1b[0m` : s),
  yellow:  (s) => (supportsColor ? `\x1b[33m${s}\x1b[0m` : s),
  blue:    (s) => (supportsColor ? `\x1b[34m${s}\x1b[0m` : s),
  magenta: (s) => (supportsColor ? `\x1b[35m${s}\x1b[0m` : s),
  cyan:    (s) => (supportsColor ? `\x1b[36m${s}\x1b[0m` : s),
  gray:    (s) => (supportsColor ? `\x1b[90m${s}\x1b[0m` : s),
  bold:    (s) => (supportsColor ? `\x1b[1m${s}\x1b[0m` : s),
  dim:     (s) => (supportsColor ? `\x1b[2m${s}\x1b[0m` : s),
};

/**
 * Get a colored score badge based on score value.
 *
 * @param {number} s - Score value 0-100
 * @returns {string} Colored badge string
 */
function scoreBadge(s) {
  if (s <= 25) return color.green(`🟢 ${s}/100`);
  if (s <= 50) return color.yellow(`🟡 ${s}/100`);
  if (s <= 75) return color.magenta(`🟠 ${s}/100`);
  return color.red(`🔴 ${s}/100`);
}

/**
 * Get a colored reliability badge.
 *
 * @param {{level: string, score: number}} reliability
 * @returns {string}
 */
function reliabilityBadge(reliability) {
  if (!reliability) return color.gray('Unknown confidence');

  const label = `${reliability.level.toUpperCase()} confidence (${reliability.score}/100)`;
  if (reliability.level === 'high') return color.green(`🟢 ${label}`);
  if (reliability.level === 'medium') return color.yellow(`🟡 ${label}`);
  return color.red(`🔴 ${label}`);
}

/**
 * Get burstiness label.
 */
function burstLabel(b) {
  if (b >= 0.7) return color.green('(high — human-like)');
  if (b >= 0.45) return color.yellow('(moderate)');
  if (b >= 0.25) return color.yellow('(low — somewhat uniform)');
  return color.red('(very low — AI-like)');
}

/**
 * Get type-token ratio label.
 */
function ttrLabel(ttr, wc) {
  if (wc < 100) return color.gray('(too short to assess)');
  if (ttr >= 0.6) return color.green('(high — diverse)');
  if (ttr >= 0.45) return color.yellow('(moderate)');
  return color.red('(low — repetitive)');
}

/**
 * Render analysis result with ANSI colors (colored terminal output).
 *
 * @param {object} result - Analysis result from analyze()
 * @param {object} flags - Parsed flags (used for threshold filtering)
 * @returns {string} Colored terminal report
 */
function renderReport(result, flags = {}) {
  const lines = [];

  lines.push('');
  lines.push(color.bold('  ┌──────────────────────────────────────────────┐'));
  lines.push(color.bold('  │        AI WRITING PATTERN ANALYSIS           │'));
  lines.push(color.bold('  └──────────────────────────────────────────────┘'));
  lines.push('');

  // Score bar with color
  const filled = Math.round(result.score / 5);
  const barColor =
    result.score <= 25
      ? color.green
      : result.score <= 50
        ? color.yellow
        : result.score <= 75
          ? color.magenta
          : color.red;
  const bar = barColor('█'.repeat(filled)) + color.dim('░'.repeat(20 - filled));
  lines.push(`  Score: ${scoreBadge(result.score)}  [${bar}]`);
  lines.push(
    `  ${color.dim(`Words: ${result.wordCount}  |  Matches: ${result.totalMatches}  |  Pattern: ${result.patternScore}  |  Uniformity: ${result.uniformityScore}`)}`,
  );
  if (result.reliability) {
    lines.push(`  ${color.dim(`Confidence: ${reliabilityBadge(result.reliability)}`)}`);
    if (result.reliability.level !== 'high' && result.reliability.reasons.length > 0) {
      lines.push(`  ${color.dim(`Why: ${result.reliability.reasons.slice(0, 2).join(' ')}`)}`);
    }
  }
  lines.push('');
  lines.push(`  ${buildSummary(result)}`);
  lines.push('');

  // Statistics
  if (result.stats) {
    const s = result.stats;
    lines.push(color.bold('  ── Statistics ──────────────────────────────────'));
    lines.push(`  Burstiness: ${s.burstiness}  ${burstLabel(s.burstiness)}`);
    lines.push(
      `  Type-token ratio: ${s.typeTokenRatio}  ${ttrLabel(s.typeTokenRatio, s.wordCount)}`,
    );
    lines.push(`  Trigram repetition: ${s.trigramRepetition}`);
    const readLine = formatReadabilityLine(s);
    if (readLine) lines.push(`  Readability: ${readLine}`);
    lines.push('');
  }

  // Category breakdown
  lines.push(color.bold('  ── Categories ──────────────────────────────────'));
  for (const [, data] of Object.entries(result.categories)) {
    if (data.matches > 0) {
      lines.push(
        `  ${color.cyan(data.label)}: ${data.matches} matches ${color.dim(`(${data.patternsDetected.join(', ')})`)}`,
      );
    }
  }
  lines.push('');

  // Findings detail
  if (result.findings.length > 0) {
    lines.push(color.bold('  ── Findings ──────────────────────────────────'));
    for (const finding of result.findings) {
      if (flags.threshold && finding.weight < flags.threshold) continue;

      lines.push('');
      const weightColor =
        finding.weight >= 4 ? color.red : finding.weight >= 2 ? color.yellow : color.blue;
      lines.push(
        `  ${weightColor(`[${finding.patternId}]`)} ${color.bold(finding.patternName)} ${color.dim(`(×${finding.matchCount}, weight: ${finding.weight})`)}`,
      );
      lines.push(`      ${color.dim(finding.description)}`);
      for (const match of finding.matches) {
        const loc = match.line ? `L${match.line}` : '';
        const preview =
          typeof match.match === 'string'
            ? match.match.substring(0, 80) + (match.match.length > 80 ? '...' : '')
            : '';
        lines.push(`      ${color.dim(loc)}: "${preview}"`);
        if (match.suggestion) {
          lines.push(`            ${color.green('→')} ${match.suggestion}`);
        }
      }
      if (finding.truncated) {
        lines.push(
          `      ${color.dim(`... and ${finding.matchCount - finding.matches.length} more`)}`,
        );
      }
    }
  }

  lines.push('');
  lines.push(color.dim('  ──────────────────────────────────────────────'));
  return lines.join('\n');
}

function renderStats(stats) {
  return formatStatsReport(stats);
}

function renderScan(scanResult, failAbove = null, baselineComparison = null) {
  return formatScanReport(scanResult, failAbove, baselineComparison);
}

function renderComparison(result) {
  return formatComparisonReport(result);
}

function renderSuggestions(result) {
  return formatGroupedSuggestions(result);
}

module.exports = {
  color,
  scoreBadge,
  reliabilityBadge,
  renderReport,
  renderStats,
  renderScan,
  renderComparison,
  renderSuggestions,
  formatJSON,
  formatMarkdown,
  formatSuggestions,
};
