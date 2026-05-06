import { describe, it, expect } from 'vitest';
import { createPatterns } from '../../../../src/core/patterns/index.js';

const esPatterns = createPatterns('es');
const getPattern = (id) => esPatterns.find(p => p.id === id);

describe('ES-01: Gerundio encadenado', () => {
  const p = () => getPattern('ES-01');
  it('exists', () => expect(p()).toBeDefined());

  it('detects 3 gerundios in same sentence', () => {
    const text = 'El sistema funciona analizando los datos, procesando la información y generando resultados.';
    expect(p().detect(text).length).toBeGreaterThan(0);
  });

  it('does not flag 1 gerundio', () => {
    const text = 'El sistema funciona analizando los datos de forma eficiente.';
    expect(p().detect(text).length).toBe(0);
  });

  it('does not flag 2 gerundios', () => {
    const text = 'El equipo fue avanzando y mejorando sus resultados.';
    expect(p().detect(text).length).toBe(0);
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
    expect(p().detect('En un mundo cada vez más conectado, las empresas deben adaptarse.').length).toBeGreaterThan(0);
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
    expect(p().detect('Es importante señalar que este proceso es clave.').length).toBeGreaterThan(0);
  });
  it('detects "vale la pena mencionar"', () => {
    expect(p().detect('Vale la pena mencionar que el equipo trabajó bien.').length).toBeGreaterThan(0);
  });
});

describe('ES-06: Disclaimers de corte (español)', () => {
  const p = () => getPattern('ES-06');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "como modelo de lenguaje"', () => {
    expect(p().detect('Como modelo de lenguaje, no puedo acceder a internet.').length).toBeGreaterThan(0);
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
    expect(p().detect('Estamos ante un momento histórico sin precedentes.').length).toBeGreaterThan(0);
  });
});

describe('ES-08: Atribuciones vagas (español)', () => {
  const p = () => getPattern('ES-08');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "los expertos señalan"', () => {
    expect(p().detect('Los expertos señalan que esto es importante.').length).toBeGreaterThan(0);
  });
  it('detects "múltiples estudios demuestran"', () => {
    expect(p().detect('Múltiples estudios demuestran que el método funciona.').length).toBeGreaterThan(0);
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
    expect(p().detect('Este método ha sido desarrollado por los investigadores.').length).toBeGreaterThan(0);
  });
  it('does not flag legitimate passive', () => {
    expect(p().detect('Se ha desarrollado un nuevo método.').length).toBe(0);
  });
});
