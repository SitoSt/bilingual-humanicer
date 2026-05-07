'use strict';

const { scoreLabel } = require('../constants');

const NON_NEWLINE = /[^\n]/g;
const FENCED_CODE_BLOCKS = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
const INLINE_CODE_SPANS = /`[^`\n]+`/g;

function maskSnippet(snippet) {
  return snippet.replace(NON_NEWLINE, ' ');
}

function stripCodeSnippets(text, opts = {}) {
  if (!text || typeof text !== 'string') return '';
  const { fenced = true, inline = true } = opts;
  let processed = text;
  if (fenced) processed = processed.replace(FENCED_CODE_BLOCKS, (m) => maskSnippet(m));
  if (inline) processed = processed.replace(INLINE_CODE_SPANS, (m) => maskSnippet(m));
  return processed;
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function burstinessLabel(b) {
  if (b >= 0.7) return '(high — human-like)';
  if (b >= 0.45) return '(moderate)';
  if (b >= 0.25) return '(low — somewhat uniform)';
  return '(very low — AI-like uniformity)';
}

function ttrLabel(ttr, wc) {
  if (wc < 100) return '(too short to assess)';
  if (ttr >= 0.6) return '(high — diverse vocabulary)';
  if (ttr >= 0.45) return '(moderate)';
  return '(low — repetitive vocabulary)';
}

function reliabilityLabel(level) {
  if (level === 'high') return 'High confidence';
  if (level === 'medium') return 'Medium confidence';
  return 'Low confidence';
}

module.exports = {
  stripCodeSnippets,
  wordCount,
  scoreLabel,
  burstinessLabel,
  ttrLabel,
  reliabilityLabel,
};
