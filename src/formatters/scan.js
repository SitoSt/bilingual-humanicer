'use strict';

/**
 * Format a scan result as plain text report.
 * Based on formatScanReport() from src/cli.js, with ANSI removed.
 *
 * scanResult shape (from workflows.scanDirectory):
 *   { targetPath, files: [{file, score, totalMatches, wordCount}], summary: {scannedFiles, skippedFiles, averageScore, maxScore, minScore, uniquePatterns}, patternHotspots: [{patternId, patternName, totalMatches, affectedFiles}], skipped: [] }
 */
function formatScanReport(scanResult, failAbove = null, baselineComparison = null) {
  const lines = [];
  const files = scanResult.files;

  lines.push('');
  lines.push('── REPO SCAN ────────────────────────────────────────');
  lines.push('');
  lines.push(`  Target: ${scanResult.targetPath}`);
  lines.push(
    `  Files scanned: ${scanResult.summary.scannedFiles}  |  Skipped: ${scanResult.summary.skippedFiles}`,
  );
  lines.push(
    `  Avg score: ${scanResult.summary.averageScore}  |  Max: ${scanResult.summary.maxScore}  |  Min: ${scanResult.summary.minScore}`,
  );
  if (typeof scanResult.summary.uniquePatterns === 'number') {
    lines.push(`  Unique patterns: ${scanResult.summary.uniquePatterns}`);
  }
  lines.push('');

  if (files.length === 0) {
    lines.push('  No files matched the scan criteria.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('  Top flagged files:');
  for (const item of files.slice(0, 20)) {
    const failTag = failAbove !== null && item.score >= failAbove ? ' [FAIL]' : ' [OK]';
    lines.push(
      `  ${item.score.toString().padStart(3)}/100${failTag} ${item.file} (${item.totalMatches} matches, ${item.wordCount} words)`,
    );
  }
  lines.push('');

  if (baselineComparison) {
    const summary = baselineComparison.summary;
    lines.push('  Baseline comparison:');
    lines.push(
      `  Compared: ${summary.comparedFiles}  |  Regressions: ${summary.regressions}  |  Improvements: ${summary.improvements}  |  Unchanged: ${summary.unchanged}`,
    );
    lines.push(
      `  New files: ${summary.newFiles}  |  Missing files: ${summary.missingFiles}  |  Threshold: ±${summary.regressionThreshold}`,
    );
    lines.push('');

    if (baselineComparison.regressions.length > 0) {
      lines.push('  Baseline regressions:');
      for (const item of baselineComparison.regressions.slice(0, 8)) {
        lines.push(
          `  +${item.delta} ${item.relativePath} (${item.baselineScore} → ${item.currentScore})`,
        );
      }
      lines.push('');
    }

    if (baselineComparison.improvements.length > 0) {
      lines.push('  Baseline improvements:');
      for (const item of baselineComparison.improvements.slice(0, 5)) {
        lines.push(
          `  ${item.delta} ${item.relativePath} (${item.baselineScore} → ${item.currentScore})`,
        );
      }
      lines.push('');
    }
  }

  if (scanResult.patternHotspots && scanResult.patternHotspots.length > 0) {
    lines.push('  Common pattern hotspots:');
    for (const item of scanResult.patternHotspots.slice(0, 8)) {
      lines.push(
        `  [${item.patternId}] ${item.patternName} (${item.totalMatches} matches across ${item.affectedFiles} files)`,
      );
    }
    lines.push('');
  }

  if (scanResult.skipped && scanResult.skipped.length > 0) {
    lines.push(`  ${scanResult.skipped.length} files skipped (too short or unreadable).`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format a compare result as plain text.
 * Based on formatComparisonReport() from src/cli.js, with ANSI removed.
 *
 * compareResult shape (from workflows.compareFiles):
 *   { before: {score, totalMatches, wordCount}, after: {score, totalMatches, wordCount}, delta: {score}, improvements: [{patternName, beforeCount, afterCount, delta}], regressions: [...] }
 */
function formatComparisonReport(result) {
  const lines = [];
  const scoreDelta = result.delta.score;
  const scoreArrow = scoreDelta < 0 ? '↓' : scoreDelta > 0 ? '↑' : '→';

  lines.push('');
  lines.push('── DRAFT COMPARISON ─────────────────────────────────');
  lines.push('');
  lines.push(
    `  Before: ${result.before.score}/100  (${result.before.totalMatches} matches, ${result.before.wordCount} words)`,
  );
  lines.push(
    `  After:  ${result.after.score}/100  (${result.after.totalMatches} matches, ${result.after.wordCount} words)`,
  );
  lines.push(`  Delta:  ${scoreArrow} ${scoreDelta >= 0 ? '+' : ''}${scoreDelta} points`);
  lines.push('');

  if (result.improvements.length > 0) {
    lines.push('  Top improvements:');
    for (const item of result.improvements.slice(0, 5)) {
      lines.push(
        `  • ${item.patternName}: ${item.beforeCount} → ${item.afterCount} (${item.delta})`,
      );
    }
    lines.push('');
  }

  if (result.regressions.length > 0) {
    lines.push('  New regressions:');
    for (const item of result.regressions.slice(0, 5)) {
      lines.push(
        `  • ${item.patternName}: ${item.beforeCount} → ${item.afterCount} (+${item.delta})`,
      );
    }
    lines.push('');
  }

  if (result.improvements.length === 0 && result.regressions.length === 0) {
    lines.push('  Pattern mix unchanged between drafts.');
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = { formatScanReport, formatComparisonReport };
