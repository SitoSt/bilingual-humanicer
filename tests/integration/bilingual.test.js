import { describe, it, expect } from 'vitest';
import { analyze, score } from '../../src/core/analyzer.js';

describe('Full pipeline — Spanish texts', () => {
  it('scores clearly AI Spanish text above 50', () => {
    const text = `
      En el mundo actual, la tecnologia juega un papel fundamental en el desarrollo de la sociedad.
      Es importante senalar que los avances han sido extraordinarios en multiples ambitos.
      Cabe destacar que los expertos senalan que el paradigma esta evolucionando.
      Asi mismo, multiples estudios demuestran que este enfoque holistico es esencial y crucial.
      Sin embargo, no obstante, en consecuencia, debemos considerar los aspectos integrales.
      En definitiva, el camino por recorrer es largo pero el futuro es prometedor y brillante.
    `;
    expect(score(text, { lang: 'es' })).toBeGreaterThan(50);
  });

  it('scores human-sounding Spanish text below 40', () => {
    const text = `
      Llame tarde. La cola era ridicula — cuarenta personas con maletas enormes.
      El de seguridad me miro el pasaporte tres veces. No se por que.
      Al final embarque el ultimo, sudando, y el asiento era el del medio.
      El del medio siempre. El vuelo duro dos horas y el nino de delante lloro todo el rato.
    `;
    expect(score(text, { lang: 'es' })).toBeLessThan(40);
  });

  it('detects Spanish-specific patterns in result findings', () => {
    const text =
      'Cabe destacar que es importante senalar los aspectos fundamentales del ecosistema.';
    const result = analyze(text, { lang: 'es' });
    const patternIds = result.findings.map((f) => f.patternId);
    expect(patternIds.some((id) => id === 'PatternES-05' || id === 'PatternEN-7')).toBe(true);
  });

  it('does not use English patterns for Spanish text', () => {
    const text = 'En el mundo actual, la tecnologia es fundamental.';
    const result = analyze(text, { lang: 'es' });
    expect(result.findings.some((f) => f.patternId === 'PatternEN-16')).toBe(false);
  });

  it('English and Spanish produce different scores for the same text', () => {
    const text = 'Cabe destacar que es importante senalar que los resultados son extraordinarios.';
    const esScore = score(text, { lang: 'es' });
    const enScore = score(text, { lang: 'en' });
    expect(esScore).toBeGreaterThan(enScore);
  });

  it('returns ifsz in stats for Spanish', () => {
    const text =
      'El sistema analiza los datos de forma eficiente. Los resultados son positivos para el proyecto.';
    const result = analyze(text, { lang: 'es' });
    expect(result.stats.ifsz).not.toBeNull();
    expect(result.stats.fleschKincaid).toBeNull();
  });
});
