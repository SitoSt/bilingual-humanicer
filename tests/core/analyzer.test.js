import { describe, it, expect } from 'vitest';
import { analyze, score } from '../../src/core/analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(name) {
  return fs.readFileSync(path.join(__dirname, '../../tests/fixtures', name), 'utf-8');
}

const AI_TEXT_ES = `En conclusión, es importante destacar que este análisis exhaustivo demuestra
claramente que el impacto transformador de las soluciones innovadoras permite navegar
los desafíos, aprovechando las oportunidades, generando valor sostenible. En el ámbito
del desarrollo moderno, cabe señalar que los expertos sugieren implementar mejores prácticas.`;

const HUMAN_TEXT_ES = `Fui al mercado el martes. Compré tres kilos de tomates y uno de cebollas.
El vendedor me dio un descuento porque era tarde. Volví a casa en bici, aunque llovía un poco.`;

describe('analyze — pure data contract', () => {
  it('returns numeric score 0-100', () => {
    const result = analyze(AI_TEXT_ES, { lang: 'es' });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('does NOT return a summary string', () => {
    const result = analyze(AI_TEXT_ES, { lang: 'es' });
    expect(result.summary).toBeUndefined();
  });

  it('returns required data fields', () => {
    const result = analyze(AI_TEXT_ES, { lang: 'es' });
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('patternScore');
    expect(result).toHaveProperty('uniformityScore');
    expect(result).toHaveProperty('reliability');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('wordCount');
    expect(result).toHaveProperty('totalMatches');
    expect(result).toHaveProperty('lang');
  });

  it('scores AI text higher than human text', () => {
    const aiScore = analyze(AI_TEXT_ES, { lang: 'es' }).score;
    const humanScore = analyze(HUMAN_TEXT_ES, { lang: 'es' }).score;
    expect(aiScore).toBeGreaterThan(humanScore);
  });

  it('propagates lang in result', () => {
    expect(analyze('text', { lang: 'en' }).lang).toBe('en');
    expect(analyze('text', { lang: 'es' }).lang).toBe('es');
  });

  it('returns empty result for empty text', () => {
    const result = analyze('');
    expect(result.score).toBe(0);
    expect(result.findings).toHaveLength(0);
  });

  it('scores clean human text low (EN)', () => {
    const result = analyze(loadFixture('human/en/ai-tools-opinion-en.txt'), { lang: 'en' });
    expect(result.score).toBeLessThan(25);
  });

  it('scores obvious AI text high (EN)', () => {
    const result = analyze(loadFixture('ai/gpt/en/ai-coding-overview-en.txt'), { lang: 'en' });
    expect(result.score).toBeGreaterThan(50);
  });

  it('marks short samples as low confidence', () => {
    const result = analyze('Great question! This helps.', { lang: 'en' });
    expect(result.reliability.level).toBe('low');
  });

  it('can ignore code snippets during analysis', () => {
    const text = [
      'Release notes:',
      '```md',
      'Great question! This serves as a testament to innovation.',
      '```',
      'Actual summary: shipped bug fixes.',
    ].join('\n');
    const regular = analyze(text, { lang: 'en' });
    const ignoreCode = analyze(text, { lang: 'en', ignoreCode: true });
    expect(regular.score).toBeGreaterThan(ignoreCode.score);
  });

  it('includes stats in result', () => {
    const result = analyze('The cat sat on the mat. The dog ran fast. The bird flew away.', {
      lang: 'en',
    });
    expect(result.stats).not.toBeNull();
    expect(result.stats).toHaveProperty('burstiness');
  });
});

describe('score', () => {
  it('returns a number between 0 and 100', () => {
    const s = score('This is a simple sentence.', { lang: 'en' });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
