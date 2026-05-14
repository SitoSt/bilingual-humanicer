'use strict';

const { createPatterns } = require('./patterns');
const { wordCount, stripCodeSnippets } = require('./utils');
const { computeStats, computeUniformityScore } = require('./stats');
const { CATEGORY_LABELS, DEFAULT_LANG } = require('../constants');

const RELIABILITY_RECOMMENDED_WORDS = 150;
const SUPPORTED_LANGS = new Set(['en', 'es']);

function analyze(text, opts = {}) {
  const {
    verbose = false,
    patternsToCheck = null,
    includeStats = true,
    ignoreCode = false,
    lang = DEFAULT_LANG,
  } = opts;

  if (!SUPPORTED_LANGS.has(lang)) {
    throw new Error(`Unsupported language "${lang}". Use "en" or "es".`);
  }

  if (!text || typeof text !== 'string') return emptyResult();

  const preparedText = ignoreCode ? stripCodeSnippets(text) : text;
  const trimmed = preparedText.trim();
  if (trimmed.length === 0) return emptyResult();

  const words = wordCount(trimmed);
  const stats = includeStats ? computeStats(trimmed, lang) : null;
  const uniformityScore =
    stats && stats.wordCount >= 20 && stats.sentenceCount >= 3
      ? computeUniformityScore(stats, lang)
      : 0;

  const findings = [];
  const categoryScores = {};
  for (const cat of Object.keys(CATEGORY_LABELS)) {
    categoryScores[cat] = { matches: 0, weightedScore: 0, patterns: [] };
  }

  const activePatterns = createPatterns(lang);
  const patternsToRun = patternsToCheck
    ? activePatterns.filter((p) => patternsToCheck.includes(p.id))
    : activePatterns;

  for (const pattern of patternsToRun) {
    const matches = pattern.detect(trimmed);
    if (matches.length > 0) {
      findings.push({
        patternId: pattern.id,
        patternName: pattern.name,
        category: pattern.category,
        description: pattern.description,
        weight: pattern.weight,
        matchCount: matches.length,
        matches: verbose ? matches : matches.slice(0, 5),
        truncated: !verbose && matches.length > 5,
      });
      categoryScores[pattern.category].matches += matches.length;
      categoryScores[pattern.category].weightedScore += matches.length * pattern.weight;
      categoryScores[pattern.category].patterns.push(pattern.name);
    }
  }

  const patternScore = calculatePatternScore(findings, words);
  const compositeScore = calculateCompositeScore(patternScore, uniformityScore, findings);
  const reliability = buildReliability({ words, stats, findings, patternScore, uniformityScore });

  const categories = {};
  for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
    const data = categoryScores[cat];
    categories[cat] = {
      label,
      matches: data.matches,
      weightedScore: data.weightedScore,
      patternsDetected: data.patterns,
    };
  }

  return {
    score: compositeScore,
    patternScore,
    uniformityScore,
    reliability,
    totalMatches: findings.reduce((sum, f) => sum + f.matchCount, 0),
    wordCount: words,
    stats,
    categories,
    findings,
    lang,
    // NOTE: no `summary` field — use formatters/report.buildSummary(result)
  };
}

function buildReliability({ words, stats, findings, patternScore, uniformityScore }) {
  const reasons = [];
  const sentenceCount = stats?.sentenceCount || 0;
  let confidenceScore = 100;

  if (words < 80) {
    confidenceScore -= 40;
    reasons.push('Sample is very short (<80 words).');
  } else if (words < RELIABILITY_RECOMMENDED_WORDS) {
    confidenceScore -= 20;
    reasons.push(`Sample is shorter than recommended (${RELIABILITY_RECOMMENDED_WORDS}+ words).`);
  }

  if (sentenceCount > 0 && sentenceCount < 4) {
    confidenceScore -= 30;
    reasons.push('Fewer than 4 sentences limits rhythm analysis.');
  } else if (sentenceCount > 0 && sentenceCount < 7) {
    confidenceScore -= 12;
    reasons.push('Sentence count is low, so statistical signals are weaker.');
  }

  if (findings.length <= 1) {
    confidenceScore -= 15;
    reasons.push('Only one AI pattern family was detected.');
  }

  if (uniformityScore === 0) {
    confidenceScore -= 10;
    reasons.push('Uniformity metrics were not applied (text too short or too sparse).');
  }

  if (patternScore >= 60 && findings.length >= 3 && words >= RELIABILITY_RECOMMENDED_WORDS) {
    confidenceScore += 5;
  }

  confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));

  const level = confidenceScore >= 75 ? 'high' : confidenceScore >= 45 ? 'medium' : 'low';

  const recommendation =
    level === 'high'
      ? 'Signal quality is strong enough for decision support.'
      : `Treat this score as directional. Re-run on ${RELIABILITY_RECOMMENDED_WORDS}+ words across multiple paragraphs before making high-stakes calls.`;

  return {
    level,
    score: confidenceScore,
    reasons,
    recommendedMinWords: RELIABILITY_RECOMMENDED_WORDS,
    recommendation,
  };
}

function calculatePatternScore(findings, words) {
  if (words === 0 || findings.length === 0) return 0;

  let weightedTotal = 0;
  for (const f of findings) {
    weightedTotal += f.matchCount * f.weight;
  }

  const density = (weightedTotal / words) * 100;
  const densityScore = Math.min(Math.log2(density + 1) * 13, 65);
  const breadthBonus = Math.min(findings.length * 2, 20);
  const categoriesHit = new Set(findings.map((f) => f.category)).size;
  const categoryBonus = Math.min(categoriesHit * 3, 15);

  return Math.min(Math.round(densityScore + breadthBonus + categoryBonus), 100);
}

function calculateCompositeScore(patternScore, uniformityScore, findings) {
  if (patternScore === 0 && uniformityScore === 0) return 0;
  if (findings.length === 0) return Math.min(Math.round(uniformityScore * 0.15), 15);
  const blended = patternScore * 0.7 + uniformityScore * 0.3;
  return Math.min(Math.round(blended), 100);
}

function score(text, opts = {}) {
  return analyze(text, opts).score;
}

function emptyResult() {
  return {
    score: 0,
    patternScore: 0,
    uniformityScore: 0,
    reliability: {
      level: 'low',
      score: 0,
      reasons: ['No text provided.'],
      recommendedMinWords: RELIABILITY_RECOMMENDED_WORDS,
      recommendation: `Provide at least ${RELIABILITY_RECOMMENDED_WORDS} words for stable scoring.`,
    },
    totalMatches: 0,
    wordCount: 0,
    stats: null,
    categories: {},
    findings: [],
    lang: DEFAULT_LANG,
  };
}

module.exports = { analyze, score, calculatePatternScore, calculateCompositeScore };
