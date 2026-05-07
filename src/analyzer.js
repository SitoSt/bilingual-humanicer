// src/analyzer.js — SHIM: wraps core/analyzer adding `summary` for backward compatibility.
// Will be deleted in Task 8.
'use strict';

const { analyze: coreAnalyze, score, calculatePatternScore, calculateCompositeScore } = require('./core/analyzer');
const { buildSummary, formatText: formatReport, formatMarkdown, formatJSON } = require('./formatters/report');
const { CATEGORY_LABELS } = require('./constants');

function analyze(text, opts = {}) {
  const result = coreAnalyze(text, opts);
  return { ...result, summary: buildSummary(result) };
}

module.exports = {
  analyze,
  score,
  calculatePatternScore,
  calculateCompositeScore,
  formatReport,
  formatMarkdown,
  formatJSON,
  CATEGORY_LABELS,
};
