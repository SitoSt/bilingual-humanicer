'use strict';

const { scoreLabel, burstinessLabel, ttrLabel, reliabilityLabel } = require('../core/utils');

function buildSummary(result) {
  const {
    score: finalScore,
    totalMatches,
    findings,
    wordCount: words,
    stats,
    reliability,
  } = result;

  if (totalMatches === 0 && finalScore < 10) {
    let s = 'No significant AI writing patterns detected. The text looks human-written.';
    if (reliability && reliability.level !== 'high') {
      s += ` Confidence: ${reliability.level}. ${reliability.recommendation}`;
    }
    return s;
  }

  const levelLabel = scoreLabel(finalScore);
  const level = levelLabel.charAt(0).toLowerCase() + levelLabel.slice(1);
  const topPatterns = [...findings]
    .sort((a, b) => b.matchCount * b.weight - a.matchCount * a.weight)
    .slice(0, 3)
    .map((f) => f.patternName);

  let s = `Score: ${finalScore}/100 (${level}). Found ${totalMatches} matches across ${findings.length} pattern types in ${words} words.`;
  if (topPatterns.length > 0) s += ` Top issues: ${topPatterns.join(', ')}.`;
  if (stats && stats.sentenceCount > 3) {
    if (stats.burstiness < 0.25) {
      s += ' Sentence rhythm is very uniform (low burstiness) — typical of AI text.';
    }
    if (stats.typeTokenRatio < 0.4 && words > 100) s += ' Vocabulary diversity is low.';
  }
  if (reliability && reliability.level !== 'high') {
    s += ` Confidence: ${reliability.level}. ${reliability.recommendation}`;
  }
  return s;
}

function formatReadabilityLine(stats) {
  if (stats.ifsz !== null && stats.ifsz !== undefined) return `IFSZ: ${stats.ifsz}`;
  if (stats.fleschKincaid !== null && stats.fleschKincaid !== undefined) {
    return `Flesch-Kincaid: ${stats.fleschKincaid} grade level`;
  }
  return null;
}

function formatText(result) {
  const lines = [];
  lines.push('');
  lines.push('╔══════════════════════════════════════════════════╗');
  lines.push('║          AI WRITING PATTERN ANALYSIS             ║');
  lines.push('╚══════════════════════════════════════════════════╝');
  lines.push('');
  const filled = Math.round(result.score / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  lines.push(`  Score: ${result.score}/100  [${bar}]`);
  lines.push(
    `  Words: ${result.wordCount}  |  Matches: ${result.totalMatches}  |  Pattern: ${result.patternScore}  |  Uniformity: ${result.uniformityScore}`,
  );
  if (result.reliability) {
    lines.push(
      `  Confidence: ${reliabilityLabel(result.reliability.level)} (${result.reliability.score}/100)`,
    );
  }
  lines.push('');
  lines.push(`  ${buildSummary(result)}`);
  lines.push('');
  if (result.stats) {
    const s = result.stats;
    lines.push('── Text Statistics ─────────────────────────────────');
    lines.push(`  Sentences: ${s.sentenceCount}  |  Paragraphs: ${s.paragraphCount}`);
    lines.push(`  Avg sentence length: ${s.avgSentenceLength} words (σ ${s.sentenceLengthStdDev})`);
    lines.push(`  Burstiness: ${s.burstiness} ${burstinessLabel(s.burstiness)}`);
    lines.push(
      `  Vocabulary diversity (TTR): ${s.typeTokenRatio} ${ttrLabel(s.typeTokenRatio, s.wordCount)}`,
    );
    lines.push(`  Function word ratio: ${s.functionWordRatio}`);
    lines.push(`  Trigram repetition: ${s.trigramRepetition}`);
    const readLine = formatReadabilityLine(s);
    if (readLine) lines.push(`  Readability: ${readLine}`);
    lines.push('');
  }
  lines.push('── Categories ──────────────────────────────────────');
  for (const [, data] of Object.entries(result.categories)) {
    if (data.matches > 0) {
      lines.push(`  ${data.label}: ${data.matches} matches (${data.patternsDetected.join(', ')})`);
    }
  }
  lines.push('');
  if (result.findings.length > 0) {
    lines.push('── Findings ────────────────────────────────────────');
    for (const finding of result.findings) {
      lines.push('');
      lines.push(
        `  [${finding.patternId}] ${finding.patternName} (×${finding.matchCount}, weight: ${finding.weight})`,
      );
      lines.push(`      ${finding.description}`);
      for (const match of finding.matches) {
        const loc = match.line ? `L${match.line}:${match.column || ''}` : '';
        const preview =
          typeof match.match === 'string'
            ? match.match.substring(0, 80) + (match.match.length > 80 ? '...' : '')
            : '';
        const conf = match.confidence ? ` [${match.confidence}]` : '';
        lines.push(`      ${loc}: "${preview}"${conf}`);
        if (match.suggestion) lines.push(`            → ${match.suggestion}`);
      }
      if (finding.truncated) {
        lines.push(`      ... and ${finding.matchCount - finding.matches.length} more`);
      }
    }
  }
  lines.push('');
  lines.push('════════════════════════════════════════════════════');
  return lines.join('\n');
}

function formatMarkdown(result) {
  const lines = [];
  lines.push('# AI writing pattern analysis');
  lines.push('');
  lines.push(`**Score: ${result.score}/100** — ${scoreLabel(result.score)}`);
  if (result.reliability) {
    lines.push(
      `**Confidence:** ${reliabilityLabel(result.reliability.level)} (${result.reliability.score}/100)`,
    );
  }
  lines.push('');
  lines.push(
    `Words: ${result.wordCount} | Matches: ${result.totalMatches} | Pattern score: ${result.patternScore} | Uniformity score: ${result.uniformityScore}`,
  );
  lines.push('');
  lines.push(buildSummary(result));
  lines.push('');
  if (result.stats) {
    const s = result.stats;
    lines.push('## Text statistics');
    lines.push('');
    lines.push('| Metric | Value | Assessment |');
    lines.push('|--------|-------|------------|');
    lines.push(
      `| Avg sentence length | ${s.avgSentenceLength} words | ${s.avgSentenceLength > 25 ? 'Long' : s.avgSentenceLength < 12 ? 'Short' : 'Normal'} |`,
    );
    lines.push(
      `| Sentence variation | σ ${s.sentenceLengthStdDev} | ${s.sentenceLengthStdDev > 8 ? 'High (human-like)' : s.sentenceLengthStdDev < 4 ? 'Low (AI-like)' : 'Moderate'} |`,
    );
    lines.push(`| Burstiness | ${s.burstiness} | ${burstinessLabel(s.burstiness)} |`);
    lines.push(
      `| Vocabulary diversity | ${s.typeTokenRatio} | ${ttrLabel(s.typeTokenRatio, s.wordCount)} |`,
    );
    lines.push(
      `| Trigram repetition | ${s.trigramRepetition} | ${s.trigramRepetition > 0.1 ? 'High (AI-like)' : 'Normal'} |`,
    );
    const readLine = formatReadabilityLine(s);
    if (readLine) lines.push(`| Readability | ${readLine} | — |`);
    lines.push('');
  }
  if (result.findings.length > 0) {
    lines.push('## Findings');
    lines.push('');
    for (const finding of result.findings) {
      lines.push(`### ${finding.patternId}. ${finding.patternName} (×${finding.matchCount})`);
      lines.push(`*${finding.description}*`);
      lines.push('');
      for (const match of finding.matches) {
        const loc = match.line ? `Line ${match.line}` : '';
        lines.push(
          `- ${loc}: \`${typeof match.match === 'string' ? match.match.substring(0, 80) : ''}\``,
        );
        if (match.suggestion) lines.push(`  - ${match.suggestion}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

function formatJSON(result) {
  return JSON.stringify(result, null, 2);
}

module.exports = { buildSummary, formatText, formatMarkdown, formatJSON, formatReadabilityLine };
