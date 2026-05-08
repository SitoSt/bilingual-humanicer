import { describe, it, expect } from 'vitest';
import { createPatterns } from '../../../../src/core/patterns/index.js';

const esPatterns = createPatterns('es');
const getPattern = (id) => esPatterns.find((p) => p.id === id);

describe('ES-01: Gerundio encadenado', () => {
  const p = () => getPattern('ES-01');
  it('exists', () => expect(p()).toBeDefined());

  it('detects 3 gerundios in same sentence', () => {
    const text =
      'El sistema funciona analizando los datos, procesando la información y generando resultados.';
    expect(p().detect(text).length).toBeGreaterThan(0);
  });

  it('does not flag 1 gerundio', () => {
    const text = 'El sistema funciona analizando los datos de forma eficiente.';
    expect(p().detect(text).length).toBe(0);
  });

  it('now flags 2 gerundios (threshold lowered)', () => {
    const text = 'El equipo fue avanzando y mejorando sus resultados.';
    expect(p().detect(text).length).toBeGreaterThan(0);
  });
});

// ES-01 threshold change: now detects 2+ gerundios
describe('ES-01: threshold change — 2 gerundios', () => {
  const p = () => getPattern('ES-01');

  it('now detects 2 gerundios in same sentence', () => {
    expect(p().detect('El equipo fue avanzando y mejorando sus resultados.').length).toBeGreaterThan(0);
  });

  it('still does not flag 1 gerundio', () => {
    expect(p().detect('El sistema funciona analizando los datos de forma eficiente.').length).toBe(0);
  });
});

// ES-02 new openers
describe('ES-02: new vague openers', () => {
  const p = () => getPattern('ES-02');

  it('detects "Vivimos en un momento en que"', () => {
    expect(p().detect('Vivimos en un momento en que la tecnología avanza sin parar.').length).toBeGreaterThan(0);
  });

  it('detects "Nos encontramos ante un momento"', () => {
    expect(p().detect('Nos encontramos ante un momento decisivo para la industria.').length).toBeGreaterThan(0);
  });

  it('detects "En los últimos años," at line start', () => {
    expect(p().detect('En los últimos años, el sector ha experimentado cambios profundos.').length).toBeGreaterThan(0);
  });

  it('detects "A lo largo de los últimos años" at line start', () => {
    expect(p().detect('A lo largo de los últimos años, el sector ha evolucionado notablemente.').length).toBeGreaterThan(0);
  });

  it('detects "Hoy en día, más que nunca,"', () => {
    expect(p().detect('Hoy en día, más que nunca, la colaboración es clave.').length).toBeGreaterThan(0);
  });

  it('detects "En pleno siglo XXI"', () => {
    expect(p().detect('En pleno siglo XXI, seguimos enfrentando estos retos.').length).toBeGreaterThan(0);
  });

  it('detects "En este contexto,"', () => {
    expect(p().detect('En este contexto, resulta fundamental analizar las tendencias.').length).toBeGreaterThan(0);
  });
});

// ES-03 expanded abstract nouns
describe('ES-03: expanded abstract nouns list', () => {
  const p = () => getPattern('ES-03');

  it('detects triada with new nouns: liderazgo, talento, diversidad', () => {
    expect(p().detect('Buscamos liderazgo, talento y diversidad en el equipo.').length).toBeGreaterThan(0);
  });

  it('detects triada with: resiliencia, agilidad, colaboración', () => {
    expect(p().detect('Fomentamos resiliencia, agilidad y colaboración en la organización.').length).toBeGreaterThan(0);
  });

  it('detects triada with: bienestar, propósito, confianza', () => {
    expect(p().detect('Nuestra cultura prioriza bienestar, propósito y confianza.').length).toBeGreaterThan(0);
  });
});

describe('ES-02: Apertura con contexto vago', () => {
  const p = () => getPattern('ES-02');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "En el mundo actual"', () => {
    expect(p().detect('En el mundo actual, la tecnología avanza.').length).toBeGreaterThan(0);
  });
  it('detects "En la era digital"', () => {
    expect(p().detect('En la era digital, todo ha cambiado.').length).toBeGreaterThan(0);
  });
  it('detects "En un mundo cada vez más"', () => {
    expect(
      p().detect('En un mundo cada vez más conectado, las empresas deben adaptarse.').length,
    ).toBeGreaterThan(0);
  });
  it('does not flag mid-sentence context', () => {
    expect(p().detect('Vivimos en el mundo actual con sus complejidades.').length).toBe(0);
  });
});

describe('ES-03: Triada de adjetivos/sustantivos abstractos', () => {
  const p = () => getPattern('ES-03');
  it('exists', () => expect(p()).toBeDefined());

  it('detects triada with "y"', () => {
    const text = 'Buscamos innovación, creatividad y transformación.';
    expect(p().detect(text).length).toBeGreaterThan(0);
  });
});

describe('ES-04: Tono sycofántico', () => {
  const p = () => getPattern('ES-04');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "excelente pregunta"', () => {
    expect(p().detect('¡Excelente pregunta!').length).toBeGreaterThan(0);
  });
  it('detects "muy buena pregunta"', () => {
    expect(p().detect('Muy buena pregunta, me alegra que lo preguntes.').length).toBeGreaterThan(0);
  });
});

describe('ES-05: Énfasis metacomentario', () => {
  const p = () => getPattern('ES-05');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "cabe destacar que"', () => {
    expect(p().detect('Cabe destacar que los resultados son positivos.').length).toBeGreaterThan(0);
  });
  it('detects "es importante señalar que"', () => {
    expect(p().detect('Es importante señalar que este proceso es clave.').length).toBeGreaterThan(
      0,
    );
  });
  it('detects "vale la pena mencionar"', () => {
    expect(p().detect('Vale la pena mencionar que el equipo trabajó bien.').length).toBeGreaterThan(
      0,
    );
  });
});

describe('ES-06: Disclaimers de corte (español)', () => {
  const p = () => getPattern('ES-06');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "como modelo de lenguaje"', () => {
    expect(
      p().detect('Como modelo de lenguaje, no puedo acceder a internet.').length,
    ).toBeGreaterThan(0);
  });
  it('detects "hasta mi fecha de corte"', () => {
    expect(p().detect('Hasta mi fecha de corte, esto era correcto.').length).toBeGreaterThan(0);
  });
});

describe('ES-07: Conclusiones genéricas (español)', () => {
  const p = () => getPattern('ES-07');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "el futuro es prometedor"', () => {
    expect(p().detect('El futuro es prometedor para esta industria.').length).toBeGreaterThan(0);
  });
  it('detects "estamos ante un momento histórico"', () => {
    expect(p().detect('Estamos ante un momento histórico sin precedentes.').length).toBeGreaterThan(
      0,
    );
  });
});

describe('ES-08: Atribuciones vagas (español)', () => {
  const p = () => getPattern('ES-08');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "los expertos señalan"', () => {
    expect(p().detect('Los expertos señalan que esto es importante.').length).toBeGreaterThan(0);
  });
  it('detects "múltiples estudios demuestran"', () => {
    expect(
      p().detect('Múltiples estudios demuestran que el método funciona.').length,
    ).toBeGreaterThan(0);
  });
});

describe('ES-09: Lenguaje excesivamente positivo', () => {
  const p = () => getPattern('ES-09');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "resultados excelentes"', () => {
    expect(p().detect('Los resultados excelentes demuestran el éxito.').length).toBeGreaterThan(0);
  });
  it('detects "avance revolucionario"', () => {
    expect(p().detect('Este es un avance revolucionario en el campo.').length).toBeGreaterThan(0);
  });
});

describe('ES-10: Pasiva con ser innecesaria', () => {
  const p = () => getPattern('ES-10');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "ha sido desarrollado por"', () => {
    expect(
      p().detect('Este método ha sido desarrollado por los investigadores.').length,
    ).toBeGreaterThan(0);
  });
  it('does not flag legitimate passive', () => {
    expect(p().detect('Se ha desarrollado un nuevo método.').length).toBe(0);
  });
});
