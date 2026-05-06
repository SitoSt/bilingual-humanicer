import { describe, it, expect } from 'vitest';
import { computeStats, computeUniformityScore } from '../../src/stats.js';

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
