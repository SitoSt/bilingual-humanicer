import { describe, it, expect } from 'vitest';
import { formatStatsReport } from '../../src/formatters/stats.js';
import { computeStats } from '../../src/core/stats.js';

const esStats = computeStats(
  'Esta es una prueba. Tiene varias palabras y frases. El texto es corto pero válido para estadísticas básicas.',
  'es',
);
const enStats = computeStats(
  'This is a test. It has several words and phrases. The text is short but valid for basic statistics.',
  'en',
);

describe('formatStatsReport', () => {
  it('contains word count', () => {
    expect(formatStatsReport(esStats)).toContain('Total words:');
    expect(formatStatsReport(enStats)).toContain('Total words:');
  });

  it('never prints "null" for any field', () => {
    expect(formatStatsReport(esStats)).not.toContain('null');
    expect(formatStatsReport(enStats)).not.toContain('null');
  });

  it('shows IFSZ for Spanish stats', () => {
    if (esStats.ifsz !== null && esStats.ifsz !== undefined) {
      expect(formatStatsReport(esStats)).toContain('IFSZ:');
    }
  });

  it('shows Flesch-Kincaid for English stats', () => {
    if (enStats.fleschKincaid !== null && enStats.fleschKincaid !== undefined) {
      expect(formatStatsReport(enStats)).toContain('Flesch-Kincaid:');
    }
  });

  it('contains no ANSI escape codes', () => {
    // eslint-disable-next-line no-control-regex
    expect(formatStatsReport(esStats)).not.toMatch(/\x1b\[/);
    // eslint-disable-next-line no-control-regex
    expect(formatStatsReport(enStats)).not.toMatch(/\x1b\[/);
  });

  it('contains burstiness info', () => {
    expect(formatStatsReport(enStats)).toContain('Burstiness:');
  });
});
