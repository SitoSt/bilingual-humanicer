/**
 * stats.test.js — Merged tests for src/core/stats.js.
 * Combines tests from tests/statistics.test.js and tests/es/stats-es.test.js.
 */

import { describe, it, expect } from 'vitest';
import {
  computeStats,
  computeUniformityScore,
  computeNgramRepetition,
  splitSentences,
  tokenize,
  estimateSyllablesEN,
  estimateSyllablesES,
} from '../../src/core/stats.js';

// ─── Tokenize ────────────────────────────────────────────

describe('tokenize', () => {
  it('splits text into lowercase words', () => {
    const result = tokenize('Hello World');
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });

  it('strips punctuation', () => {
    const result = tokenize('Hello, world! How are you?');
    expect(result).toContain('hello');
    expect(result).not.toContain('hello,');
  });

  it('handles empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

// ─── Sentence Splitting ─────────────────────────────────

describe('splitSentences', () => {
  it('splits on periods', () => {
    const result = splitSentences('Hello world. How are you. Fine.');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('splits on question marks and exclamation points', () => {
    const result = splitSentences('What? Really! Yes.');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles single sentence', () => {
    const result = splitSentences('Just one sentence.');
    expect(result.length).toBe(1);
  });

  it('handles abbreviations', () => {
    const result = splitSentences('Dr. Smith went home. Mr. Jones followed.');
    // Should split into 2 sentences, not 4
    expect(result.length).toBe(2);
  });
});

// ─── Syllable Estimation ─────────────────────────────────

describe('estimateSyllablesEN', () => {
  it('counts syllables in basic words', () => {
    expect(estimateSyllablesEN('cat')).toBe(1);
    expect(estimateSyllablesEN('the')).toBe(1);
  });

  it('counts syllables in longer words', () => {
    expect(estimateSyllablesEN('beautiful')).toBeGreaterThanOrEqual(2);
    expect(estimateSyllablesEN('computer')).toBeGreaterThanOrEqual(2);
  });

  it('handles edge cases', () => {
    expect(estimateSyllablesEN('a')).toBeGreaterThanOrEqual(1);
    expect(estimateSyllablesEN('xyz')).toBeGreaterThanOrEqual(1);
  });
});

// ─── N-gram Repetition ──────────────────────────────────

describe('computeNgramRepetition', () => {
  it('returns 0 for short input', () => {
    expect(computeNgramRepetition(['the', 'cat'], 3)).toBe(0);
  });

  it('detects repeated trigrams', () => {
    const words = 'the cat sat the cat sat the cat sat'.split(' ');
    const rep = computeNgramRepetition(words, 3);
    expect(rep).toBeGreaterThan(0);
  });

  it('returns 0 for all unique trigrams', () => {
    const words = 'one two three four five six seven eight nine ten'.split(' ');
    const rep = computeNgramRepetition(words, 3);
    expect(rep).toBe(0);
  });
});

// ─── computeStats ────────────────────────────────────────

describe('computeStats', () => {
  // Use lang='en' for English tests (default is Spanish)
  const text = 'The quick brown fox jumps over the lazy dog. The dog did not try to catch the fox.';
  const stats = computeStats(text, 'en');

  it('returns all expected properties', () => {
    expect(stats).toHaveProperty('sentenceCount');
    expect(stats).toHaveProperty('burstiness');
    expect(stats).toHaveProperty('typeTokenRatio');
    expect(stats).toHaveProperty('functionWordRatio');
    expect(stats).toHaveProperty('fleschKincaid');
    expect(stats).toHaveProperty('paragraphCount');
    expect(stats).toHaveProperty('trigramRepetition');
  });

  it('handles empty input', () => {
    const stats = computeStats('');
    expect(stats.wordCount).toBe(0);
    expect(stats.sentenceCount).toBe(0);
  });

  it('handles null input', () => {
    const stats = computeStats(null);
    expect(stats.wordCount).toBe(0);
  });

  // Sentence stats
  it('counts sentences correctly', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const stats = computeStats(text, 'en');
    expect(stats.sentenceCount).toBe(3);
  });

  it('computes average sentence length', () => {
    const text = 'Short one. This is a bit longer sentence.';
    const stats = computeStats(text, 'en');
    expect(stats.avgSentenceLength).toBeGreaterThan(0);
  });

  it('computes burstiness', () => {
    // Very uniform sentences → low burstiness
    const uniform = 'The cat sat down. The dog ran fast. The cow ate hay. The fox was sly.';
    const uniformStats = computeStats(uniform);

    // Very varied sentences → higher burstiness
    const varied =
      'Hi. This is a much longer sentence with many more words in it that goes on and on for a while. OK.';
    const variedStats = computeStats(varied);

    expect(variedStats.burstiness).toBeGreaterThan(uniformStats.burstiness);
  });

  // Vocabulary stats
  it('counts total and unique words', () => {
    const text = 'The cat and the dog and the bird.';
    const stats = computeStats(text, 'en');
    expect(stats.wordCount).toBeGreaterThan(0);
    expect(stats.uniqueWordCount).toBeLessThanOrEqual(stats.wordCount);
  });

  it('computes type-token ratio', () => {
    const repetitive = 'the the the the dog the the the the cat';
    const repStats = computeStats(repetitive, 'en');

    const diverse = 'cats dogs birds fish horses cows sheep goats pigs';
    const divStats = computeStats(diverse, 'en');

    expect(divStats.typeTokenRatio).toBeGreaterThan(repStats.typeTokenRatio);
  });

  // Paragraph stats
  it('counts paragraphs', () => {
    const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
    const stats = computeStats(text, 'en');
    expect(stats.paragraphCount).toBe(3);
  });

  // Readability
  it('computes Flesch-Kincaid grade level', () => {
    const text = 'The cat sat on the mat. The dog ate the bone. The bird flew away.';
    const stats = computeStats(text, 'en');
    expect(stats.fleschKincaid).toBeDefined();
    expect(typeof stats.fleschKincaid).toBe('number');
  });

  // Function word ratio
  it('computes function word ratio', () => {
    const text = 'The cat is in the box with the hat on the mat.';
    const stats = computeStats(text, 'en');
    expect(stats.functionWordRatio).toBeGreaterThan(0);
    expect(stats.functionWordRatio).toBeLessThan(1);
  });
});

// ─── estimateSyllablesES ──────────────────────────────────

describe('estimateSyllablesES', () => {
  const cases = [
    ['pan', 1],
    ['casa', 2],
    ['libro', 2],
    ['árbol', 2],
    ['ciudad', 2],
    ['bueno', 3],
    ['pie', 2],
    ['agua', 3],
    ['hua', 2],
    ['hue', 2],
    ['tiene', 3],
    ['poema', 3],
    ['caer', 2],
    ['día', 2],
    ['frío', 2],
    ['universidad', 5],
    ['extraordinario', 7],
    ['deshidratado', 5],
    ['caiga', 3],
    ['caía', 3],
    ['lluvia', 3],
    ['nación', 3],
    ['realmente', 4],
  ];

  for (const [word, expected] of cases) {
    it(`"${word}" → ${expected} sílaba(s)`, () => {
      expect(estimateSyllablesES(word)).toBe(expected);
    });
  }

  it('returns 1 for single-char word', () => {
    expect(estimateSyllablesES('a')).toBe(1);
  });

  it('returns 1 for empty string', () => {
    expect(estimateSyllablesES('')).toBe(1);
  });

  it('handles uppercase and mixed case', () => {
    expect(estimateSyllablesES('CASA')).toBe(2);
    expect(estimateSyllablesES('España')).toBe(3);
  });
});

// ─── computeUniformityScore ──────────────────────────────

describe('computeUniformityScore', () => {
  it('returns 0 for empty stats', () => {
    const stats = computeStats('');
    expect(computeUniformityScore(stats)).toBe(0);
  });

  it('returns higher score for uniform text', () => {
    const uniform =
      'This is a sentence. Here is another one. And there is one more. Plus yet another sentence. One final sentence too.';
    const uniformStats = computeStats(uniform);
    const uniformScore = computeUniformityScore(uniformStats);

    const varied =
      'Short. This is a much much longer sentence that really goes on for a while with many more words. Medium one here. Yes. And then this one wraps up with a moderate number of words.';
    const variedStats = computeStats(varied);
    const variedScore = computeUniformityScore(variedStats);

    expect(uniformScore).toBeGreaterThanOrEqual(variedScore);
  });

  it('returns a number between 0 and 100', () => {
    const text = 'The cat sat. The dog ran. The bird flew. The fish swam.';
    const stats = computeStats(text, 'en');
    const score = computeUniformityScore(stats);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── Spanish-specific tests (from tests/es/stats-es.test.js) ─────────────────

const AI_TEXT_ES = `
En el mundo actual, la tecnologia juega un papel fundamental en el desarrollo de la sociedad.
Es importante senalar que los avances han sido extraordinarios y revolucionarios.
Cabe destacar que los expertos senalan que el futuro es prometedor para todos.
Asimsmo, multiples estudios demuestran que este paradigma es esencial y crucial.
Sin embargo, no obstante, en consecuencia, debemos considerar los aspectos holisticos.
En definitiva, el camino por recorrer es largo pero el futuro es brillante y alentador.
`;

const HUMAN_TEXT_ES = `
Llegue tarde al aeropuerto. La cola de embarque era ridicula — cuarenta personas delante de mi,
todas arrastrando maletas demasiado grandes para el portaequipajes. El de seguridad me miro el
pasaporte tres veces. No se por que. Al final embarque el ultimo, sudando, y el asiento era el
del medio. El del medio siempre.
`;

describe('computeStats with lang=es', () => {
  it('accepts lang parameter without throwing', () => {
    expect(() => computeStats(AI_TEXT_ES, 'es')).not.toThrow();
  });

  it('returns ifsz field when lang=es', () => {
    const stats = computeStats(AI_TEXT_ES, 'es');
    expect(stats).toHaveProperty('ifsz');
    expect(typeof stats.ifsz).toBe('number');
  });

  it('does not return ifsz when lang=en', () => {
    const stats = computeStats(AI_TEXT_ES, 'en');
    expect(stats.ifsz).toBeNull();
  });

  it('IFSZ is between 0 and 100', () => {
    const stats = computeStats(AI_TEXT_ES, 'es');
    expect(stats.ifsz).toBeGreaterThanOrEqual(0);
    expect(stats.ifsz).toBeLessThanOrEqual(100);
  });

  it('returns hapaxLegomenaRate field', () => {
    const stats = computeStats(AI_TEXT_ES, 'es');
    expect(stats).toHaveProperty('hapaxLegomenaRate');
    expect(stats.hapaxLegomenaRate).toBeGreaterThanOrEqual(0);
    expect(stats.hapaxLegomenaRate).toBeLessThanOrEqual(1);
  });

  it('returns connectorDensity field for Spanish', () => {
    const stats = computeStats(AI_TEXT_ES, 'es');
    expect(stats).toHaveProperty('connectorDensity');
    expect(typeof stats.connectorDensity).toBe('number');
  });

  it('AI Spanish text has higher connectorDensity than human text', () => {
    const aiStats = computeStats(AI_TEXT_ES, 'es');
    const humanStats = computeStats(HUMAN_TEXT_ES, 'es');
    expect(aiStats.connectorDensity).toBeGreaterThan(humanStats.connectorDensity);
  });

  it('backward compat: lang=en still returns fleschKincaid', () => {
    const stats = computeStats('The quick brown fox jumps over the lazy dog.', 'en');
    expect(stats).toHaveProperty('fleschKincaid');
    expect(typeof stats.fleschKincaid).toBe('number');
  });

  it('existing English tests still pass with explicit lang=en', () => {
    const stats = computeStats('This is a test sentence. It has multiple sentences here.', 'en');
    expect(stats.wordCount).toBeGreaterThan(0);
    expect(stats.fleschKincaid).not.toBeNull();
  });
});

describe('computeUniformityScore with lang=es', () => {
  it('accepts lang parameter', () => {
    const stats = computeStats(AI_TEXT_ES, 'es');
    expect(() => computeUniformityScore(stats, 'es')).not.toThrow();
  });

  it('returns a number 0-100', () => {
    const stats = computeStats(AI_TEXT_ES, 'es');
    const score = computeUniformityScore(stats, 'es');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('AI Spanish text scores higher uniformity than human Spanish text', () => {
    const aiStats = computeStats(AI_TEXT_ES, 'es');
    const humanStats = computeStats(HUMAN_TEXT_ES, 'es');
    const aiScore = computeUniformityScore(aiStats, 'es');
    const humanScore = computeUniformityScore(humanStats, 'es');
    expect(aiScore).toBeGreaterThan(humanScore);
  });
});
