// src/core/humanizer.js — pure data, no formatting
'use strict';

const { analyze } = require('./analyzer');
const { DEFAULT_LANG } = require('../constants');

const HIDDEN_UNICODE_CHARS = /(?:\u200B|\u200C|\u200D|\u2060|\uFEFF|\u00AD)/;
const HIDDEN_UNICODE_CHARS_GLOBAL = /(?:\u200B|\u200C|\u200D|\u2060|\uFEFF|\u00AD)/g;
const NON_BREAKING_SPACES = /(?:\u00A0|\u202F)/;
const NON_BREAKING_SPACES_GLOBAL = /(?:\u00A0|\u202F)/g;

// ─── Automatic Fixes ─────────────────────────────────────

/**
 * Apply safe, mechanical fixes that don't require judgment.
 * Only transforms where the "right" answer is unambiguous.
 *
 * @param {string} text — Input text
 * @returns {{ text: string, fixes: string[] }}
 */
function autoFix(text) {
  let result = text;
  const fixes = [];

  // Curly quotes → straight quotes
  if (/[\u201C\u201D]/.test(result)) {
    result = result.replace(/[\u201C\u201D]/g, '"');
    fixes.push('Replaced curly double quotes with straight quotes');
  }
  if (/[\u2018\u2019]/.test(result)) {
    result = result.replace(/[\u2018\u2019]/g, "'");
    fixes.push('Replaced curly single quotes with straight quotes');
  }

  // Hidden obfuscation chars → remove/normalize
  if (HIDDEN_UNICODE_CHARS.test(result)) {
    result = result.replace(HIDDEN_UNICODE_CHARS_GLOBAL, '');
    fixes.push('Removed hidden unicode characters (zero-width/soft hyphen)');
  }
  if (NON_BREAKING_SPACES.test(result)) {
    result = result.replace(NON_BREAKING_SPACES_GLOBAL, ' ');
    fixes.push('Normalized non-breaking spaces to regular spaces');
  }

  // Filler phrase replacements (unambiguous)
  const safeFills = [
    { from: /\bin order to\b/gi, to: 'to', label: '"in order to" → "to"' },
    {
      from: /\bdue to the fact that\b/gi,
      to: 'because',
      label: '"due to the fact that" → "because"',
    },
    { from: /\bat this point in time\b/gi, to: 'now', label: '"at this point in time" → "now"' },
    { from: /\bin the event that\b/gi, to: 'if', label: '"in the event that" → "if"' },
    { from: /\bhas the ability to\b/gi, to: 'can', label: '"has the ability to" → "can"' },
    { from: /\bfor the purpose of\b/gi, to: 'to', label: '"for the purpose of" → "to"' },
    { from: /\bfirst and foremost\b/gi, to: 'first', label: '"first and foremost" → "first"' },
    {
      from: /\bin light of the fact that\b/gi,
      to: 'because',
      label: '"in light of the fact that" → "because"',
    },
    { from: /\bin the realm of\b/gi, to: 'in', label: '"in the realm of" → "in"' },
    { from: /\butilize\b/gi, to: 'use', label: '"utilize" → "use"' },
    { from: /\butilizing\b/gi, to: 'using', label: '"utilizing" → "using"' },
    { from: /\butilization\b/gi, to: 'use', label: '"utilization" → "use"' },
  ];

  for (const { from, to, label } of safeFills) {
    if (from.test(result)) {
      result = result.replace(from, to);
      fixes.push(label);
    }
  }

  // Chatbot artifact removal (start/end of text)
  const chatbotStart = [
    /^(Here is|Here's) (a |an |the )?(comprehensive |brief |quick )?(overview|summary|breakdown|list|guide|explanation|look)[^.]*\.\s*/i,
    /^(Of course|Certainly|Absolutely|Sure)!\s*/i,
    /^(Great|Excellent|Good|Wonderful|Fantastic) question!\s*/i,
    /^(That's|That is) a (great|excellent|good|wonderful|fantastic) (question|point)!\s*/i,
  ];
  for (const regex of chatbotStart) {
    if (regex.test(result)) {
      result = result.replace(regex, '');
      fixes.push('Removed chatbot opening artifact');
    }
  }

  const chatbotEnd = [
    /\s*(I hope this helps|Let me know if you('d| would) like|Feel free to|Don't hesitate to|Is there anything else)[^.]*[.!]\s*$/i,
    /\s*Happy to help[.!]?\s*$/i,
  ];
  for (const regex of chatbotEnd) {
    if (regex.test(result)) {
      result = result.replace(regex, '');
      fixes.push('Removed chatbot closing artifact');
    }
  }

  result = result.trim();
  return { text: result, fixes };
}

// ─── Suggestion Engine ───────────────────────────────────

/**
 * Generate humanization suggestions.
 *
 * @param {string} text    — Input text
 * @param {object} opts    — Options
 * @returns {object}       — Suggestions report (pure data, no formatting)
 */
function humanize(text, opts = {}) {
  const { autofix = false, includeStats = true, ignoreCode = false, lang = DEFAULT_LANG } = opts;

  const analysis = analyze(text, { verbose: true, includeStats, ignoreCode, lang });

  const critical = [], important = [], minor = [];

  for (const finding of analysis.findings) {
    const suggestions = finding.matches.map((m) => ({
      pattern: finding.patternName,
      patternId: finding.patternId,
      category: finding.category,
      weight: finding.weight,
      text: m.match,
      line: m.line,
      column: m.column,
      suggestion: m.suggestion,
      confidence: m.confidence || 'high',
    }));
    if (finding.weight >= 4)      critical.push(...suggestions);
    else if (finding.weight >= 2) important.push(...suggestions);
    else                          minor.push(...suggestions);
  }

  let fixedText = null, appliedFixes = [];
  if (autofix) {
    const r = autoFix(text);
    fixedText = r.text;
    appliedFixes = r.fixes;
  }

  const guidance  = buildGuidance(analysis);
  const styleTips = includeStats && analysis.stats ? buildStyleTips(analysis.stats) : [];

  return {
    score: analysis.score,
    patternScore: analysis.patternScore,
    uniformityScore: analysis.uniformityScore,
    reliability: analysis.reliability,
    wordCount: analysis.wordCount,
    totalIssues: analysis.totalMatches,
    stats: analysis.stats,
    critical,
    important,
    minor,
    autofix: autofix ? { text: fixedText, fixes: appliedFixes } : null,
    guidance,    // string[]
    styleTips,   // array of { metric, value, tip }
    analysis,    // full AnalysisResult (NEW — not in old humanizer.js)
  };
}

/**
 * Like humanize() but accepts a pre-computed AnalysisResult to avoid double analysis.
 * @param {object} opts.originalText — Required when opts.autofix is true
 */
function humanizeResult(analysisResult, opts = {}) {
  const { autofix = false, includeStats = true } = opts;

  const critical = [], important = [], minor = [];
  for (const finding of analysisResult.findings) {
    const suggestions = finding.matches.map((m) => ({
      pattern: finding.patternName,
      patternId: finding.patternId,
      category: finding.category,
      weight: finding.weight,
      text: m.match,
      line: m.line,
      column: m.column,
      suggestion: m.suggestion,
      confidence: m.confidence || 'high',
    }));
    if (finding.weight >= 4)      critical.push(...suggestions);
    else if (finding.weight >= 2) important.push(...suggestions);
    else                          minor.push(...suggestions);
  }

  let autofixResult = null;
  if (autofix) {
    if (opts.originalText) {
      const r = autoFix(opts.originalText);
      autofixResult = { text: r.text, fixes: r.fixes };
    }
    // else: autofix requested but no originalText — return null (caller did not provide text)
  }

  const guidance  = buildGuidance(analysisResult);
  const styleTips = includeStats && analysisResult.stats ? buildStyleTips(analysisResult.stats) : [];

  return {
    score: analysisResult.score,
    patternScore: analysisResult.patternScore,
    uniformityScore: analysisResult.uniformityScore,
    reliability: analysisResult.reliability,
    wordCount: analysisResult.wordCount,
    totalIssues: analysisResult.totalMatches,
    stats: analysisResult.stats,
    critical, important, minor,
    autofix: autofixResult,
    guidance,
    styleTips,
    analysis: analysisResult,
  };
}

/**
 * Build pattern-based guidance.
 */
function buildGuidance(analysis) {
  const tips = [];
  const ids = new Set(analysis.findings.map((f) => f.patternId));

  if (ids.has(1) || ids.has(4)) {
    tips.push(
      'Replace inflated/promotional language with concrete facts. What specifically happened? Give dates, numbers, names.',
    );
  }
  if (ids.has(3)) {
    tips.push(
      'Cut trailing -ing phrases. If the point matters enough to mention, give it its own sentence.',
    );
  }
  if (ids.has(5)) {
    tips.push('Name your sources. "Experts say" means nothing — who said it, when, and where?');
  }
  if (ids.has(6)) {
    tips.push(
      'Replace formulaic "despite challenges" sections with specific problems and concrete outcomes.',
    );
  }
  if (ids.has(7)) {
    tips.push(
      'Swap AI vocabulary for plainer words. "Delve" → "look at". "Tapestry" → (be specific). "Showcase" → "show".',
    );
  }
  if (ids.has(8)) {
    tips.push('Use "is" and "has" freely. "Serves as" and "boasts" are needlessly fancy.');
  }
  if (ids.has(9)) {
    tips.push('Drop "not just X, it\'s Y" frames. Just say what the thing is.');
  }
  if (ids.has(10)) {
    tips.push("Break up triads. You don't always need three of everything.");
  }
  if (ids.has(13)) {
    tips.push('Ease up on em dashes. Use commas, periods, or parentheses for variety.');
  }
  if (ids.has(14) || ids.has(15)) {
    tips.push('Strip mechanical bold formatting and inline-header lists. Let prose do the work.');
  }
  if (ids.has(17)) {
    tips.push('Remove emojis from professional text. They signal chatbot output.');
  }
  if (ids.has(19) || ids.has(21)) {
    tips.push(
      'Remove chatbot filler ("I hope this helps!", "Great question!"). Just deliver the content.',
    );
  }
  if (ids.has(20)) {
    tips.push('Delete knowledge-cutoff disclaimers. Either research it or leave it out.');
  }
  if (ids.has(22) || ids.has(23)) {
    tips.push('Trim filler and hedging. "In order to" → "to". One qualifier per claim is enough.');
  }
  if (ids.has(24)) {
    tips.push(
      'Cut generic conclusions. End with a specific fact instead of "the future looks bright".',
    );
  }
  if (ids.has(29)) {
    tips.push(
      'Remove hidden unicode characters (zero-width, soft hyphen, NBSP). They can break readability and look like detector-gaming obfuscation.',
    );
  }

  if (analysis.score >= 50) {
    tips.push(
      "Consider rewriting from scratch. When AI patterns are this dense, patching individual phrases isn't enough — the structure itself needs rethinking.",
    );
  }

  return tips;
}

/**
 * Build statistical style tips based on text metrics.
 * These suggest structural improvements beyond word choice.
 */
function buildStyleTips(stats) {
  const tips = [];

  // Burstiness
  if (stats.burstiness < 0.25 && stats.sentenceCount > 4) {
    tips.push({
      metric: 'burstiness',
      value: stats.burstiness,
      tip: 'Sentence rhythm is very uniform. Mix short punchy sentences (3-8 words) with longer flowing ones (20+). Fragments work too. Like this.',
    });
  }

  // Sentence length variation
  if (stats.sentenceLengthVariation < 0.3 && stats.sentenceCount > 4) {
    tips.push({
      metric: 'sentenceLengthVariation',
      value: stats.sentenceLengthVariation,
      tip: `Sentences are all roughly ${Math.round(stats.avgSentenceLength)} words. Vary your rhythm — alternate between short and long.`,
    });
  }

  // Very long average sentences
  if (stats.avgSentenceLength > 28) {
    tips.push({
      metric: 'avgSentenceLength',
      value: stats.avgSentenceLength,
      tip: 'Average sentence is quite long. Break some into shorter ones. Not every thought needs a subordinate clause.',
    });
  }

  // Low vocabulary diversity
  if (stats.typeTokenRatio < 0.4 && stats.wordCount > 100) {
    tips.push({
      metric: 'typeTokenRatio',
      value: stats.typeTokenRatio,
      tip: "Vocabulary is repetitive. Try using more varied word choices — but don't synonym-cycle (that's also an AI tell).",
    });
  }

  // High trigram repetition
  if (stats.trigramRepetition > 0.1 && stats.wordCount > 100) {
    tips.push({
      metric: 'trigramRepetition',
      value: stats.trigramRepetition,
      tip: 'Repeated 3-word phrases detected. Vary your sentence structures.',
    });
  }

  // Add humanization techniques if text scores poorly
  if (tips.length >= 2) {
    tips.push({
      metric: 'general',
      value: null,
      tip: "Try the read-aloud test: read the text out loud. If it sounds weird or robotic, rewrite those parts until they sound like something you'd actually say.",
    });
    tips.push({
      metric: 'general',
      value: null,
      tip: 'Add first-person perspective where it fits: "I found", "We noticed", "In my experience". Real humans write from a point of view.',
    });
  }

  return tips;
}

// ─── Exports ─────────────────────────────────────────────

module.exports = { humanize, humanizeResult, autoFix, buildGuidance, buildStyleTips };
