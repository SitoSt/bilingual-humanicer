/**
 * vocabulary-es.test.js — Tests for Spanish AI vocabulary.
 */

import { describe, it, expect } from 'vitest';
import { getLocale } from '../../../../src/locales/index.js';

const es = getLocale('es');

describe('Spanish TIER_1 — dead giveaways', () => {
  const mustInclude = [
    'fundamental',
    'crucial',
    'esencial',
    'primordial',
    'indispensable',
    'invaluable',
    'trascendental',
    'revolucionario',
    'innovador',
    'disruptivo',
    'robusto',
    'integral',
    'holístico',
    'paradigma',
    'sinergia',
    'ecosistema',
    'panorama',
    'potenciar',
    'optimizar',
    'maximizar',
    'aprovechar',
    'impulsar',
    'catalizar',
    'empoderar',
    'apalancar',
    'destacar',
    'subrayar',
    'evidenciar',
  ];
  for (const word of mustInclude) {
    it(`includes "${word}"`, () => {
      expect(es.TIER_1).toContain(word);
    });
  }
});

describe('Spanish TIER_2 — suspicious in density', () => {
  const mustInclude = [
    'asimismo',
    'igualmente',
    'no obstante',
    'sin embargo',
    'en consecuencia',
    'cabe destacar',
    'cabe señalar',
    'es importante mencionar',
    'vale la pena destacar',
    'en el mundo actual',
    'hoy en día',
  ];
  for (const word of mustInclude) {
    it(`includes "${word}"`, () => {
      expect(es.TIER_2).toContain(word);
    });
  }
});

describe('Spanish AI_PHRASES', () => {
  it('has at least 20 phrase patterns', () => {
    expect(es.AI_PHRASES.length).toBeGreaterThanOrEqual(20);
  });

  it('each phrase has pattern, tier, and fix', () => {
    for (const phrase of es.AI_PHRASES) {
      expect(phrase).toHaveProperty('pattern');
      expect(phrase).toHaveProperty('tier');
      expect(phrase).toHaveProperty('fix');
      expect(phrase.pattern).toBeInstanceOf(RegExp);
    }
  });

  it('detects "cabe destacar que"', () => {
    const text = 'Cabe destacar que los resultados son positivos.';
    const found = es.AI_PHRASES.some(({ pattern }) => pattern.test(text));
    expect(found).toBe(true);
  });

  it('detects "en el mundo actual"', () => {
    const text = 'En el mundo actual, la tecnología avanza.';
    const found = es.AI_PHRASES.some(({ pattern }) => pattern.test(text));
    expect(found).toBe(true);
  });

  it('detects "excelente pregunta"', () => {
    const text = '¡Excelente pregunta! Me alegra que lo preguntes.';
    const found = es.AI_PHRASES.some(({ pattern }) => pattern.test(text));
    expect(found).toBe(true);
  });

  it('detects "espero que esto te ayude"', () => {
    const text = 'Espero que esto te ayude a entender el tema.';
    const found = es.AI_PHRASES.some(({ pattern }) => pattern.test(text));
    expect(found).toBe(true);
  });
});

describe('Spanish FUNCTION_WORDS', () => {
  it('contains core Spanish function words', () => {
    const required = [
      'el',
      'la',
      'de',
      'que',
      'en',
      'y',
      'a',
      'los',
      'las',
      'un',
      'una',
      'por',
      'con',
      'para',
    ];
    for (const w of required) {
      expect(es.FUNCTION_WORDS).toContain(w);
    }
  });
  it('does not contain English-only function words', () => {
    expect(es.FUNCTION_WORDS).not.toContain('the');
    expect(es.FUNCTION_WORDS).not.toContain('of');
  });
});

describe('Spanish CONNECTORS', () => {
  it('has at least 30 connectors', () => {
    expect(es.CONNECTORS.length).toBeGreaterThanOrEqual(30);
  });
  it('contains core overused connectors', () => {
    const required = ['asimismo', 'no obstante', 'sin embargo', 'en consecuencia', 'por lo tanto'];
    for (const c of required) {
      expect(es.CONNECTORS).toContain(c);
    }
  });
});
