'use strict';

const DEFAULT_LANG = 'es';

const SCORE_THRESHOLDS = {
  HUMAN: { max: 19, label: 'Mostly human-sounding' },
  LIGHT: { max: 44, label: 'Lightly AI-touched' },
  MODERATE: { max: 69, label: 'Moderately AI-influenced' },
  HEAVY: { max: 100, label: 'Heavily AI-generated' },
};

const CATEGORY_LABELS = {
  content: 'Content patterns',
  language: 'Language & grammar',
  style: 'Style patterns',
  communication: 'Communication artifacts',
  filler: 'Filler & hedging',
};

function scoreLabel(s) {
  if (s > SCORE_THRESHOLDS.MODERATE.max) return SCORE_THRESHOLDS.HEAVY.label;
  if (s > SCORE_THRESHOLDS.LIGHT.max) return SCORE_THRESHOLDS.MODERATE.label;
  if (s > SCORE_THRESHOLDS.HUMAN.max) return SCORE_THRESHOLDS.LIGHT.label;
  return SCORE_THRESHOLDS.HUMAN.label;
}

module.exports = { DEFAULT_LANG, SCORE_THRESHOLDS, CATEGORY_LABELS, scoreLabel };
