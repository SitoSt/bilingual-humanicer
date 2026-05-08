# Spanish Patterns Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Spanish AI detection from 10 to 20 patterns and overhaul vocabulary tiers, preferring false positives over false negatives.

**Architecture:** All changes are isolated to two files: `src/locales/es.js` (vocabulary) and `src/core/patterns/es.js` (patterns). Tests live in `tests/core/patterns/es/`. No other files change.

**Tech Stack:** Node.js ≥18, CommonJS (`require`/`module.exports`) in src, ESM (`import`) in tests, Vitest.

---

## File map

| File | What changes |
|------|-------------|
| `src/locales/es.js` | TIER_1 +30 words, TIER_3 +33 words, remove `significativo` from TIER_3, AI_PHRASES +14 entries |
| `src/core/patterns/es.js` | ES-01–ES-10 improved, ES-11–ES-20 added |
| `tests/core/patterns/es/vocabulary-es.test.js` | New describe blocks for new vocabulary |
| `tests/core/patterns/es/patterns-es.test.js` | Updated tests for ES-01/02/03 threshold changes + new tests ES-11–ES-20 |

---

## Task 1: Vocabulary expansion (`src/locales/es.js`)

**Files:**
- Modify: `src/locales/es.js`
- Test: `tests/core/patterns/es/vocabulary-es.test.js`

- [ ] **Step 1: Write the failing tests**

Add at the bottom of `tests/core/patterns/es/vocabulary-es.test.js`:

```javascript
describe('TIER_1 — 2026-05-08 expansions', () => {
  it('contains new analytical verbs', () => {
    expect(es.TIER_1).toContain('abordar');
    expect(es.TIER_1).toContain('examinar');
    expect(es.TIER_1).toContain('desglosar');
    expect(es.TIER_1).toContain('desgranar');
    expect(es.TIER_1).toContain('profundizar');
    expect(es.TIER_1).toContain('adentrarse');
    expect(es.TIER_1).toContain('ahondar');
    expect(es.TIER_1).toContain('dilucidar');
  });

  it('contains new positive emotional adjectives', () => {
    expect(es.TIER_1).toContain('gratificante');
    expect(es.TIER_1).toContain('fascinante');
    expect(es.TIER_1).toContain('motivador');
    expect(es.TIER_1).toContain('estimulante');
    expect(es.TIER_1).toContain('revelador');
    expect(es.TIER_1).toContain('enriquecedor');
    expect(es.TIER_1).toContain('apasionante');
    expect(es.TIER_1).toContain('esclarecedor');
    expect(es.TIER_1).toContain('prometedor');
    expect(es.TIER_1).toContain('valioso');
  });

  it('contains corporate/management vocabulary', () => {
    expect(es.TIER_1).toContain('multidisciplinar');
    expect(es.TIER_1).toContain('transversal');
    expect(es.TIER_1).toContain('interdisciplinar');
    expect(es.TIER_1).toContain('alineado');
    expect(es.TIER_1).toContain('resiliencia');
    expect(es.TIER_1).toContain('resiliente');
    expect(es.TIER_1).toContain('agilidad');
    expect(es.TIER_1).toContain('vertebrar');
    expect(es.TIER_1).toContain('pivotar');
    expect(es.TIER_1).toContain('iterar');
  });

  it('significativo promoted to TIER_1 and removed from TIER_3', () => {
    expect(es.TIER_1).toContain('significativo');
    expect(es.TIER_3).not.toContain('significativo');
  });

  it('extraordinario added to TIER_1', () => {
    expect(es.TIER_1).toContain('extraordinario');
  });
});

describe('TIER_3 — 2026-05-08 expansions', () => {
  it('has at least 55 words', () => {
    expect(es.TIER_3.length).toBeGreaterThanOrEqual(55);
  });

  it('contains newly added context-dependent words', () => {
    expect(es.TIER_3).toContain('viable');
    expect(es.TIER_3).toContain('coherente');
    expect(es.TIER_3).toContain('concreto');
    expect(es.TIER_3).toContain('consistente');
    expect(es.TIER_3).toContain('flexible');
    expect(es.TIER_3).toContain('global');
    expect(es.TIER_3).toContain('óptimo');
    expect(es.TIER_3).toContain('potencial');
  });
});

describe('AI_PHRASES — 2026-05-08 expansions', () => {
  it('has at least 70 phrase patterns', () => {
    expect(es.AI_PHRASES.length).toBeGreaterThanOrEqual(70);
  });

  it('detects "en el marco de"', () => {
    const text = 'En el marco de esta investigación se analizaron los datos.';
    expect(es.AI_PHRASES.some(({ pattern }) => pattern.test(text))).toBe(true);
  });

  it('detects "llevar a cabo"', () => {
    const text = 'Para llevar a cabo este proyecto necesitamos recursos.';
    expect(es.AI_PHRASES.some(({ pattern }) => pattern.test(text))).toBe(true);
  });

  it('detects "en aras de"', () => {
    const text = 'En aras de la transparencia, publicamos los resultados.';
    expect(es.AI_PHRASES.some(({ pattern }) => pattern.test(text))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/patterns/es/vocabulary-es.test.js
```
Expected: Multiple FAIL — words not yet in arrays.

- [ ] **Step 3: Implement vocabulary changes in `src/locales/es.js`**

In `src/locales/es.js`, replace the existing `TIER_1` array with the expanded version:

```javascript
const TIER_1 = [
  // Original — metacommentary verbs
  'destacar', 'subrayar', 'enfatizar', 'recalcar', 'remarcar',
  'evidenciar', 'ilustrar', 'demostrar', 'revelar',

  // Original — importance adjectives
  'fundamental', 'crucial', 'esencial', 'primordial', 'indispensable',
  'imprescindible', 'invaluable', 'inestimable', 'trascendental',
  'revolucionario', 'innovador', 'vanguardista', 'disruptivo', 'pionero',
  'robusto', 'sólido', 'integral', 'holístico', 'exhaustivo',
  'meticuloso', 'riguroso', 'minucioso',

  // Original — AI buzzword nouns
  'paradigma', 'sinergia', 'ecosistema', 'ámbito', 'panorama',
  'espectro', 'horizonte', 'tejido', 'esfera', 'dominio',

  // Original — action verbs
  'potenciar', 'optimizar', 'maximizar', 'aprovechar', 'impulsar',
  'catalizar', 'empoderar', 'apalancar', 'articular', 'implementar',
  'gestionar', 'promover', 'fomentar', 'garantizar',

  // NEW — analytical performance verbs (AI announces analysis instead of doing it)
  'abordar', 'examinar', 'desglosar', 'desgranar', 'profundizar',
  'adentrarse', 'ahondar', 'dilucidar', 'explorar', 'comprender',
  'identificar',

  // NEW — positive emotional adjectives (AI uses 96%+ more than humans)
  'gratificante', 'fascinante', 'motivador', 'estimulante', 'revelador',
  'enriquecedor', 'apasionante', 'esclarecedor', 'prometedor', 'valioso',

  // NEW — corporate/management vocabulary
  'multidisciplinar', 'transversal', 'interdisciplinar', 'alineado',
  'resiliencia', 'resiliente', 'agilidad', 'ownership',
  'vertebrar', 'pivotar', 'iterar',

  // NEW — promoted from TIER_3 (strong enough to be dead giveaways)
  'significativo', 'extraordinario',
];
```

Replace the existing `TIER_3` array — remove `significativo` (now in TIER_1) and add 33 new words:

```javascript
const TIER_3 = [
  // Original (minus significativo, now in TIER_1)
  'relevante', 'notable', 'considerable', 'sustancial',
  'efectivo', 'eficiente', 'eficaz', 'productivo', 'exitoso',
  'único', 'especial', 'excepcional',
  'estratégico', 'estratégicamente', 'proactivo', 'dinámico',
  'sostenible', 'escalable', 'transformador',
  'innovación', 'digitalización', 'transformación',
  'mejores prácticas', 'valor añadido', 'propuesta de valor',

  // NEW — context-dependent adjectives
  'abundante', 'amplio', 'apropiado', 'beneficioso', 'central',
  'clave', 'coherente', 'complejo', 'concreto', 'consistente',
  'continuo', 'diverso', 'específico', 'flexible', 'frecuente',
  'global', 'importante', 'integral', 'moderno', 'necesario',
  'nuevo', 'objetivo', 'óptimo', 'particular', 'positivo',
  'potencial', 'preciso', 'principal', 'progresivo', 'real',
  'reciente', 'típico', 'variado', 'viable',
];
```

At the end of the `AI_PHRASES` array, before the closing `];`, add the 14 new entries:

```javascript
  // NEW — framing/bureaucratic phrases
  { pattern: /\ben el marco de\b/gi, tier: 2, fix: '(ser específico sobre el contexto)' },
  { pattern: /\ben el ámbito de\b/gi, tier: 2, fix: '(ser específico)' },
  { pattern: /\bdesde esta perspectiva\b/gi, tier: 2, fix: '(decir desde cuál perspectiva o eliminar)' },
  { pattern: /\ben aras de\b/gi, tier: 2, fix: '(usar "para" o ser directo)' },
  { pattern: /\bcon miras a\b/gi, tier: 2, fix: '(usar "para")' },
  { pattern: /\bde cara a\b/gi, tier: 2, fix: '(usar "para" o "ante")' },
  { pattern: /\ba nivel de\b/gi, tier: 2, fix: '(eliminar o ser específico)' },
  { pattern: /\ba modo de ejemplo\b/gi, tier: 2, fix: '(usar "por ejemplo")' },
  { pattern: /\ba título de ejemplo\b/gi, tier: 2, fix: '(usar "por ejemplo")' },
  { pattern: /\bllevar a cabo\b/gi, tier: 2, fix: '(usar el verbo directo: "hacer", "realizar", "ejecutar")' },
  { pattern: /\bponer en marcha\b/gi, tier: 2, fix: '(usar "iniciar", "lanzar", "comenzar")' },
  { pattern: /\bdar respuesta a\b/gi, tier: 2, fix: '(usar "responder a")' },
  { pattern: /\bhacer frente a\b/gi, tier: 2, fix: '(usar "afrontar", "abordar")' },
  { pattern: /\ba lo largo de\b/gi, tier: 2, fix: '(dar período concreto: "entre 2020 y 2024")' },
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/patterns/es/vocabulary-es.test.js
```
Expected: All PASS.

- [ ] **Step 5: Run full test suite to check no regressions**

```bash
npm test
```
Expected: 318+ tests passing, 0 failing.

- [ ] **Step 6: Commit**

```bash
git add src/locales/es.js tests/core/patterns/es/vocabulary-es.test.js
git commit -m "feat(es): expand vocabulary — TIER_1 +30, TIER_3 +33, AI_PHRASES +14"
```

---

## Task 2: Improve ES-01, ES-02, ES-03

**Files:**
- Modify: `src/core/patterns/es.js` (ES-01, ES-02, ES-03 detect functions)
- Test: `tests/core/patterns/es/patterns-es.test.js`

- [ ] **Step 1: Write the failing tests**

Add after the existing ES-01 describe block in `tests/core/patterns/es/patterns-es.test.js`:

```javascript
// ES-01 threshold change: now detects 2+ gerunds
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: New tests FAIL.

- [ ] **Step 3: Update ES-01 detect function in `src/core/patterns/es.js`**

Replace the ES-01 `detect` function body (the `sentenceRegex` currently requires 3 gerunds):

```javascript
detect(text) {
  // Lowered from 3 to 2 gerunds — two chained gerunds is already a strong AI signal in Spanish
  const sentenceRegex =
    /[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*/gi;
  return findMatches(
    text,
    sentenceRegex,
    'Rewrite with finite verbs and separate clauses instead of chained gerunds.',
    'high',
  );
},
```

- [ ] **Step 4: Update ES-02 detect function in `src/core/patterns/es.js`**

Replace the ES-02 `detect` function body with the multi-pattern version:

```javascript
detect(text) {
  const patterns = [
    /^en (el mundo|la sociedad|el contexto|la era|un mundo|nuestros días) actual/im,
    /^en un mundo cada vez más/im,
    /^en la era (digital|moderna|actual|tecnológica)/im,
    /^en el panorama actual/im,
    /^vivimos en (un|el) momento/im,
    /^nos encontramos (en|ante) (un|el) momento/im,
    /^en los últimos años[,\s]/im,
    /^a lo largo de los últimos años/im,
    /^hoy en día[,\s] más que nunca/im,
    /^en pleno siglo (xxi|veintiuno)/im,
    /^en este (contexto|escenario|marco|entorno)[,\s]/im,
  ];
  const results = [];
  for (const regex of patterns) {
    results.push(
      ...findMatches(text, regex, 'Remove — start with a concrete fact or specific claim.', 'high'),
    );
  }
  return results;
},
```

- [ ] **Step 5: Update ES-03 detect function in `src/core/patterns/es.js`**

Replace the `abstracts` constant inside the ES-03 `detect` function:

```javascript
detect(text) {
  const abstracts =
    '(?:innovación|creatividad|transformación|eficiencia|productividad|excelencia|sostenibilidad|transparencia|integridad|compromiso|visión|misión|valores|estrategia|impacto|crecimiento|desarrollo|mejora|calidad|rendimiento|liderazgo|talento|diversidad|inclusión|bienestar|propósito|agilidad|resiliencia|colaboración|confianza|empoderamiento|autenticidad|pasión|vocación|flexibilidad|adaptabilidad|proactividad|cohesión|sinergia|equidad)';
  return findMatches(
    text,
    new RegExp(`${abstracts},\\s+${abstracts}\\s+y\\s+${abstracts}`, 'gi'),
    'Pick one concept and develop it concretely. Triplets feel formulaic.',
    'medium',
  );
},
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: All PASS.

- [ ] **Step 7: Run full suite**

```bash
npm test
```
Expected: All passing.

- [ ] **Step 8: Commit**

```bash
git add src/core/patterns/es.js tests/core/patterns/es/patterns-es.test.js
git commit -m "feat(es): improve ES-01 (2 gerundios), ES-02 (more openers), ES-03 (more abstracts)"
```

---

## Task 3: Improve ES-04, ES-07, ES-08, ES-09, ES-10

**Files:**
- Modify: `src/core/patterns/es.js`
- Test: `tests/core/patterns/es/patterns-es.test.js`

- [ ] **Step 1: Write the failing tests**

Add after the existing tests for each pattern:

```javascript
describe('ES-04: closing sycophancy', () => {
  const p = () => getPattern('ES-04');

  it('detects "espero haber sido de ayuda"', () => {
    expect(p().detect('Espero haber sido de ayuda.').length).toBeGreaterThan(0);
  });

  it('detects "ha sido un placer ayudarte"', () => {
    expect(p().detect('Ha sido un placer ayudarte con esta consulta.').length).toBeGreaterThan(0);
  });

  it('detects "no dudes en volver a preguntar"', () => {
    expect(p().detect('No dudes en volver a preguntar si tienes más dudas.').length).toBeGreaterThan(0);
  });
});

describe('ES-07: expanded generic conclusions', () => {
  const p = () => getPattern('ES-07');

  it('detects "todo apunta a que"', () => {
    expect(p().detect('Todo apunta a que el sector seguirá creciendo.').length).toBeGreaterThan(0);
  });

  it('detects "es hora de actuar"', () => {
    expect(p().detect('Es hora de actuar y tomar las decisiones necesarias.').length).toBeGreaterThan(0);
  });

  it('detects "marca un antes y un después"', () => {
    expect(p().detect('Este descubrimiento marca un antes y un después en la industria.').length).toBeGreaterThan(0);
  });
});

describe('ES-08: expanded vague attributions', () => {
  const p = () => getPattern('ES-08');

  it('detects "los datos revelan"', () => {
    expect(p().detect('Los datos revelan que el método es efectivo.').length).toBeGreaterThan(0);
  });

  it('detects "se ha demostrado que"', () => {
    expect(p().detect('Se ha demostrado que este enfoque funciona.').length).toBeGreaterThan(0);
  });

  it('detects "está comprobado que"', () => {
    expect(p().detect('Está comprobado que la formación continua mejora resultados.').length).toBeGreaterThan(0);
  });
});

describe('ES-09: expanded positive language', () => {
  const p = () => getPattern('ES-09');

  it('detects "experiencia enriquecedora"', () => {
    expect(p().detect('Fue una experiencia enriquecedora para todo el equipo.').length).toBeGreaterThan(0);
  });

  it('detects "oportunidad única"', () => {
    expect(p().detect('Es una oportunidad única que no debemos dejar pasar.').length).toBeGreaterThan(0);
  });

  it('detects "hito histórico"', () => {
    expect(p().detect('Este acuerdo representa un hito histórico en el sector.').length).toBeGreaterThan(0);
  });
});

describe('ES-10: expanded unnecessary passive', () => {
  const p = () => getPattern('ES-10');

  it('detects "debe ser considerado"', () => {
    expect(p().detect('Este factor debe ser considerado en el análisis.').length).toBeGreaterThan(0);
  });

  it('detects "puede ser implementado"', () => {
    expect(p().detect('El sistema puede ser implementado en cualquier empresa.').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: New tests FAIL.

- [ ] **Step 3: Update ES-04 in `src/core/patterns/es.js`**

Add four new regex patterns to the ES-04 `patterns` array:

```javascript
// Add these to the ES-04 patterns array:
/\bespero haber (sido de ayuda|respondido (tu|su) pregunta|aclarado (tus|sus) dudas)\b/gi,
/\bespero que (esto|esta información|esta respuesta) te haya (sido útil|ayudado|servido)\b/gi,
/\bha sido un placer (ayudarte|atenderte|responderte|asistirte)\b/gi,
/\bno dudes en (volver a )?(preguntar|consultarme|escribirme)\b/gi,
```

- [ ] **Step 4: Update ES-07 in `src/core/patterns/es.js`**

Add to the ES-07 `patterns` array:

```javascript
// Add these to the ES-07 patterns array:
/\btodo (apunta|indica|señala) a que\b/gi,
/\bes (hora|momento) de (actuar|reflexionar|cambiar)\b/gi,
/\bmarca un antes y un después\b/gi,
/\ben este contexto[,\s]+resulta evidente que\b/gi,
/\bestá claro que el futuro\b/gi,
/\bsin duda alguna[,\s]/gi,
/\bel reto (está|queda) en (nuestras|sus) manos\b/gi,
```

- [ ] **Step 5: Update ES-08 in `src/core/patterns/es.js`**

Add to the ES-08 `patterns` array:

```javascript
// Add these to the ES-08 patterns array:
/\blos datos (revelan|apuntan|confirman|evidencian)\b/gi,
/\bla mayoría de (los expertos|los especialistas|los estudios)\b/gi,
/\bse (sabe|ha demostrado|ha comprobado) que\b/gi,
/\bestá (comprobado|demostrado|probado) que\b/gi,
/\bfuentes (especializadas|autorizadas|consultadas) (indican|señalan|afirman)\b/gi,
```

- [ ] **Step 6: Update ES-09 in `src/core/patterns/es.js`**

Add to the ES-09 `patterns` array:

```javascript
// Add these to the ES-09 patterns array:
/\bexperiencia (única|enriquecedora|transformadora|inolvidable|gratificante)\b/gi,
/\boportunidad (única|excepcional|irrepetible|histórica|inigualable)\b/gi,
/\bhito (histórico|sin precedentes|fundamental|trascendental)\b/gi,
/\b(nunca|jamás) (antes )?(habíamos|hemos) (visto|experimentado) (algo|nada) (igual|similar|parecido)\b/gi,
/\bmarca un antes y un después\b/gi,
```

- [ ] **Step 7: Update ES-10 in `src/core/patterns/es.js`**

Replace the ES-10 `detect` function with the expanded version:

```javascript
detect(text) {
  const patterns = [
    // Original: ser-passive with agent ("por")
    /\b(ha|fue|es|será|han|fueron|son|serán|había|habían|sería|serían)\s+(sido\s+)?\w+ado\b[^.!?]{0,30}\bpor\b/gi,
    // NEW: modal + ser + participio
    /\b(debe|puede|tiene que|debería|tendría que|hay que)\s+ser\s+\w+ado\b/gi,
    /\b(deben|pueden|tienen que|deberían|tendrían que)\s+ser\s+\w+ados\b/gi,
  ];
  const results = [];
  for (const regex of patterns) {
    results.push(
      ...findMatches(
        text,
        regex,
        'Consider se-passive or active voice: "se ha desarrollado" or "los investigadores han desarrollado".',
        'low',
      ),
    );
  }
  return results;
},
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: All PASS.

- [ ] **Step 9: Run full suite**

```bash
npm test
```
Expected: All passing.

- [ ] **Step 10: Commit**

```bash
git add src/core/patterns/es.js tests/core/patterns/es/patterns-es.test.js
git commit -m "feat(es): improve ES-04 ES-07 ES-08 ES-09 ES-10 with expanded patterns"
```

---

## Task 4: New patterns ES-11, ES-12, ES-13

**Files:**
- Modify: `src/core/patterns/es.js`
- Test: `tests/core/patterns/es/patterns-es.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/core/patterns/es/patterns-es.test.js`:

```javascript
describe('ES-11: Framing de análisis', () => {
  const p = () => getPattern('ES-11');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "procedemos a analizar"', () => {
    expect(p().detect('Procedemos a analizar los principales factores.').length).toBeGreaterThan(0);
  });

  it('detects "comencemos por entender"', () => {
    expect(p().detect('Comencemos por entender qué es la inteligencia artificial.').length).toBeGreaterThan(0);
  });

  it('detects "a continuación vamos a explorar"', () => {
    expect(p().detect('A continuación vamos a explorar las tres principales causas.').length).toBeGreaterThan(0);
  });

  it('detects "permíteme explicarte"', () => {
    expect(p().detect('Permíteme explicarte cómo funciona este proceso.').length).toBeGreaterThan(0);
  });

  it('does not flag normal transition "a continuación, los resultados"', () => {
    expect(p().detect('A continuación, los resultados del experimento.').length).toBe(0);
  });
});

describe('ES-12: Copula avoidance española', () => {
  const p = () => getPattern('ES-12');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "sirve como"', () => {
    expect(p().detect('Este documento sirve como guía para el equipo.').length).toBeGreaterThan(0);
  });

  it('detects "actúa como"', () => {
    expect(p().detect('El coordinador actúa como enlace entre los departamentos.').length).toBeGreaterThan(0);
  });

  it('detects "se erige como"', () => {
    expect(p().detect('La empresa se erige como líder del sector.').length).toBeGreaterThan(0);
  });

  it('detects "desempeña el papel de"', () => {
    expect(p().detect('La tecnología desempeña el papel de catalizador en este proceso.').length).toBeGreaterThan(0);
  });

  it('does not flag "funciona correctamente"', () => {
    expect(p().detect('El sistema funciona correctamente en todos los entornos.').length).toBe(0);
  });
});

describe('ES-13: Pregunta retórica de apertura', () => {
  const p = () => getPattern('ES-13');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "¿Alguna vez te has preguntado" at start', () => {
    expect(p().detect('¿Alguna vez te has preguntado cómo funciona el aprendizaje automático?').length).toBeGreaterThan(0);
  });

  it('detects "¿Sabías que" at start', () => {
    expect(p().detect('¿Sabías que el 80% de las empresas ya usan IA?').length).toBeGreaterThan(0);
  });

  it('detects "¿Qué pasaría si" at start', () => {
    expect(p().detect('¿Qué pasaría si pudiéramos automatizar todo el proceso?').length).toBeGreaterThan(0);
  });

  it('does not flag rhetorical question mid-text', () => {
    const text = 'Los resultados fueron sorprendentes. ¿Sabías que el método falló en el 30% de los casos? Esto cambió nuestro enfoque.';
    expect(p().detect(text).length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: ES-11, ES-12, ES-13 tests FAIL with "Cannot read properties of undefined".

- [ ] **Step 3: Add ES-11, ES-12, ES-13 to `src/core/patterns/es.js`**

Append to the `PATTERNS_ES` array before `module.exports`:

```javascript
  {
    id: 'ES-11',
    name: 'Framing de análisis',
    category: 'filler',
    langs: ['es'],
    description:
      'AI announces what it is about to analyze or explain instead of doing it directly.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\bprocedemos a (analizar|explorar|examinar|ver|estudiar|revisar)\b/gi,
        /\bcomencemos por (entender|analizar|explorar|ver|revisar|examinar)\b/gi,
        /\ba continuación (vamos a|exploraremos|analizaremos|veremos|abordaremos)\b/gi,
        /\bantes de (responder|continuar|avanzar)[,\s]+es (importante|necesario|fundamental) (analizar|entender|explorar|considerar)\b/gi,
        /\bpermíteme (explicarte|presentarte|mostrarte|guiarte)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Start with the content directly — remove the framing.', 'high'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-12',
    name: 'Copula avoidance española',
    category: 'language',
    langs: ['es'],
    description:
      'Avoiding "es/son" by substituting verbose copula equivalents. Borrowed from English AI training data.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\b(sirve|sirven) como\b/gi,
        /\b(actúa|actúan) como\b/gi,
        /\bse (erige|erigen) como\b/gi,
        /\bse (posiciona|posicionan) como\b/gi,
        /\bse (presenta|presentan) como (un|una|el|la)\b/gi,
        /\bdesempeña(n)? (el|un) papel (de|fundamental|clave|crucial|central)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Use "es/son" directly.', 'medium'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-13',
    name: 'Pregunta retórica de apertura',
    category: 'content',
    langs: ['es'],
    description:
      'AI hooks with a rhetorical question at the start of a paragraph or text. Rarely appears in human writing.',
    weight: 4,
    detect(text) {
      const patterns = [
        /^¿alguna vez (te has|se ha) preguntado\b/im,
        /^¿sabías que\b/im,
        /^¿te (has dado cuenta|has puesto a pensar|has parado a pensar)\b/im,
        /^¿qué (pasaría|ocurriría|sucedería) si\b/im,
        /^¿cómo (es posible|puede ser|explicar) que\b/im,
        /^¿por qué (es importante|deberíamos|merece la pena|debería importarnos)\b/im,
        /^¿(has|hemos) (pensado|reflexionado|considerado) alguna vez\b/im,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Start with the answer, not the question.', 'high'),
        );
      }
      return results;
    },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: All PASS.

- [ ] **Step 5: Run full suite**

```bash
npm test
```
Expected: All passing.

- [ ] **Step 6: Commit**

```bash
git add src/core/patterns/es.js tests/core/patterns/es/patterns-es.test.js
git commit -m "feat(es): add ES-11 (framing), ES-12 (copula avoidance), ES-13 (pregunta retórica)"
```

---

## Task 5: New patterns ES-14, ES-15, ES-16

**Files:**
- Modify: `src/core/patterns/es.js`
- Test: `tests/core/patterns/es/patterns-es.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
describe('ES-14: Hedging excesivo', () => {
  const p = () => getPattern('ES-14');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "podría decirse que"', () => {
    expect(p().detect('Podría decirse que el enfoque ha sido efectivo.').length).toBeGreaterThan(0);
  });

  it('detects "en cierta medida"', () => {
    expect(p().detect('En cierta medida, los resultados confirman la hipótesis.').length).toBeGreaterThan(0);
  });

  it('detects "hasta cierto punto"', () => {
    expect(p().detect('Hasta cierto punto, la metodología es válida.').length).toBeGreaterThan(0);
  });

  it('detects "de alguna manera"', () => {
    expect(p().detect('De alguna manera, todos somos responsables del resultado.').length).toBeGreaterThan(0);
  });

  it('detects "en mayor o menor medida"', () => {
    expect(p().detect('En mayor o menor medida, todos estamos afectados.').length).toBeGreaterThan(0);
  });
});

describe('ES-15: Paralelismo negativo', () => {
  const p = () => getPattern('ES-15');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "no solo X sino también Y"', () => {
    expect(p().detect('No solo mejora la productividad sino también la satisfacción del equipo.').length).toBeGreaterThan(0);
  });

  it('detects "no sólo X sino que además Y"', () => {
    expect(p().detect('No sólo reduce costes sino que además mejora la calidad.').length).toBeGreaterThan(0);
  });

  it('detects "no únicamente X sino también Y"', () => {
    expect(p().detect('No únicamente afecta al rendimiento sino también al bienestar.').length).toBeGreaterThan(0);
  });

  it('does not flag normal negation', () => {
    expect(p().detect('No tenemos datos suficientes para esta conclusión.').length).toBe(0);
  });
});

describe('ES-16: Desafíos formulaicos', () => {
  const p = () => getPattern('ES-16');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "a pesar de los retos"', () => {
    expect(p().detect('A pesar de los retos, el equipo logró sus objetivos.').length).toBeGreaterThan(0);
  });

  it('detects "si bien existen desafíos"', () => {
    expect(p().detect('Si bien existen desafíos, las oportunidades son enormes.').length).toBeGreaterThan(0);
  });

  it('detects "aunque el camino no es sencillo"', () => {
    expect(p().detect('Aunque el camino no es sencillo, los resultados justifican el esfuerzo.').length).toBeGreaterThan(0);
  });

  it('detects "no es tarea fácil"', () => {
    expect(p().detect('Implementar este cambio no es tarea fácil.').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: ES-14, ES-15, ES-16 tests FAIL.

- [ ] **Step 3: Add ES-14, ES-15, ES-16 to `src/core/patterns/es.js`**

Append to the `PATTERNS_ES` array:

```javascript
  {
    id: 'ES-14',
    name: 'Hedging excesivo',
    category: 'filler',
    langs: ['es'],
    description: 'Multiple hedges that weaken statements without adding information.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\bpodría (decirse|considerarse|afirmarse|argumentarse|entenderse) que\b/gi,
        /\bes posible (que|considerar|decir|afirmar)\b/gi,
        /\ben cierta (medida|forma|manera)\b/gi,
        /\bhasta cierto punto\b/gi,
        /\bde alguna (manera|forma|modo)\b/gi,
        /\ben algún sentido\b/gi,
        /\bde cierta (forma|manera|modo)\b/gi,
        /\ben mayor o menor medida\b/gi,
        /\ben términos generales\b/gi,
        /\bde (una forma|un modo) (u otra|u otro)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Say it directly or omit it.', 'medium'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-15',
    name: 'Paralelismo negativo',
    category: 'language',
    langs: ['es'],
    description:
      'Formulaic "not only X but also Y" construct overused by AI in Spanish.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\bno (solo|sólo) .{3,80}sino (también|que además|incluso)\b/gi,
        /\bno únicamente .{3,80}sino (también|que)\b/gi,
        /\bno meramente .{3,80}sino\b/gi,
        /\bno simplemente .{3,80}sino\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Choose one idea and develop it directly.', 'medium'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-16',
    name: 'Desafíos formulaicos',
    category: 'content',
    langs: ['es'],
    description:
      'AI acknowledges challenges in a formulaic way before pivoting to optimism. Spanish equivalent of EN-6.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\ba pesar de (los|estos|dichos|los numerosos) (retos|desafíos|obstáculos|dificultades)\b/gi,
        /\bsi bien (existen|hay|persisten|se presentan) (retos|desafíos|obstáculos|dificultades)\b/gi,
        /\baunque (el camino|el proceso|la tarea|el reto) no (es|será|resulta|sea) (sencillo|fácil|simple|corto)\b/gi,
        /\blos (retos|desafíos|obstáculos) (son|existen|persisten|son muchos|son numerosos)[^.]{0,60}(pero|sin embargo|no obstante|aunque)\b/gi,
        /\bno (es|será|resulta) (tarea|camino) (fácil|sencilla|simple)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Name the specific challenge or remove the framing.', 'medium'),
        );
      }
      return results;
    },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: All PASS.

- [ ] **Step 5: Run full suite**

```bash
npm test
```
Expected: All passing.

- [ ] **Step 6: Commit**

```bash
git add src/core/patterns/es.js tests/core/patterns/es/patterns-es.test.js
git commit -m "feat(es): add ES-14 (hedging), ES-15 (paralelismo negativo), ES-16 (desafíos formulaicos)"
```

---

## Task 6: New patterns ES-17, ES-18, ES-19, ES-20

**Files:**
- Modify: `src/core/patterns/es.js`
- Test: `tests/core/patterns/es/patterns-es.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
describe('ES-17: Estructura excesiva', () => {
  const p = () => getPattern('ES-17');
  it('exists', () => expect(p()).toBeDefined());

  it('detects bold inline header in bullet', () => {
    const text = '- **Ventaja principal:** Reduce el tiempo de proceso.\n- **Desventaja:** Requiere formación.';
    expect(p().detect(text).length).toBeGreaterThan(0);
  });

  it('detects 5 consecutive bullet lines', () => {
    const text = '- Primer punto\n- Segundo punto\n- Tercer punto\n- Cuarto punto\n- Quinto punto\n- Sexto punto';
    expect(p().detect(text).length).toBeGreaterThan(0);
  });

  it('does not flag 4 or fewer consecutive bullets', () => {
    const text = '- Primer punto\n- Segundo punto\n- Tercer punto\n- Cuarto punto';
    expect(p().detect(text).length).toBe(0);
  });
});

describe('ES-18: Apertura de artículo formulaica', () => {
  const p = () => getPattern('ES-18');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "En este artículo vamos a explorar"', () => {
    expect(p().detect('En este artículo vamos a explorar las claves del éxito empresarial.').length).toBeGreaterThan(0);
  });

  it('detects "A lo largo de este post"', () => {
    expect(p().detect('A lo largo de este post analizaremos las principales tendencias.').length).toBeGreaterThan(0);
  });

  it('detects "En las siguientes líneas"', () => {
    expect(p().detect('En las siguientes líneas te explicamos cómo funciona.').length).toBeGreaterThan(0);
  });

  it('detects "Este artículo tiene como objetivo"', () => {
    expect(p().detect('Este artículo tiene como objetivo analizar el impacto del cambio climático.').length).toBeGreaterThan(0);
  });
});

describe('ES-19: Cierre de chatbot español', () => {
  const p = () => getPattern('ES-19');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "espero que esto te haya sido útil"', () => {
    expect(p().detect('Espero que esto te haya sido útil para tu proyecto.').length).toBeGreaterThan(0);
  });

  it('detects "¿hay algo más en lo que pueda ayudarte?"', () => {
    expect(p().detect('¿Hay algo más en lo que pueda ayudarte?').length).toBeGreaterThan(0);
  });

  it('detects "quedo a tu disposición"', () => {
    expect(p().detect('Quedo a tu disposición para cualquier consulta adicional.').length).toBeGreaterThan(0);
  });

  it('detects "si tienes alguna otra pregunta"', () => {
    expect(p().detect('Si tienes alguna otra pregunta, no dudes en escribirme.').length).toBeGreaterThan(0);
  });
});

describe('ES-20: Clickbait de guía', () => {
  const p = () => getPattern('ES-20');
  it('exists', () => expect(p()).toBeDefined());

  it('detects "todo lo que necesitas saber sobre"', () => {
    expect(p().detect('Todo lo que necesitas saber sobre la inteligencia artificial.').length).toBeGreaterThan(0);
  });

  it('detects "guía completa de"', () => {
    expect(p().detect('Guía completa de marketing digital para principiantes.').length).toBeGreaterThan(0);
  });

  it('detects numeric clickbait "10 razones para"', () => {
    expect(p().detect('10 razones para empezar a usar IA en tu empresa.').length).toBeGreaterThan(0);
  });

  it('detects "lo que nadie te cuenta sobre"', () => {
    expect(p().detect('Lo que nadie te cuenta sobre el trabajo remoto.').length).toBeGreaterThan(0);
  });

  it('does not flag a plain sentence with a number', () => {
    expect(p().detect('El equipo tiene 10 personas y trabaja en 3 proyectos.').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: ES-17 through ES-20 tests FAIL.

- [ ] **Step 3: Add ES-17, ES-18, ES-19, ES-20 to `src/core/patterns/es.js`**

Append to the `PATTERNS_ES` array:

```javascript
  {
    id: 'ES-17',
    name: 'Estructura excesiva',
    category: 'style',
    langs: ['es'],
    description: 'AI over-structures content with bold inline headers in bullet lists or excessive consecutive bullets.',
    weight: 2,
    detect(text) {
      const results = [];

      // Bold inline header in bullet: "- **Header:** content"
      results.push(
        ...findMatches(
          text,
          /^[ \t]*[-*•][ \t]+\*\*[^*\n]{2,40}:\*\*/gm,
          'Use prose paragraphs; reserve bullets for genuinely list-like content.',
          'low',
        ),
      );

      // 5+ consecutive bullet lines
      const lines = text.split('\n');
      let count = 0;
      let startOffset = 0;
      let currentOffset = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^[ \t]*[-*•][ \t]+/.test(lines[i])) {
          if (count === 0) startOffset = currentOffset;
          count++;
        } else {
          if (count >= 5) {
            results.push({
              match: lines
                .slice(i - count, i)
                .join('\n')
                .substring(0, 60),
              index: startOffset,
              line: i - count + 1,
              column: 1,
              suggestion: 'Reduce bullet points — use prose for most content.',
              confidence: 'low',
            });
          }
          count = 0;
        }
        currentOffset += lines[i].length + 1;
      }
      if (count >= 5) {
        results.push({
          match: lines
            .slice(lines.length - count)
            .join('\n')
            .substring(0, 60),
          index: startOffset,
          line: lines.length - count + 1,
          column: 1,
          suggestion: 'Reduce bullet points — use prose for most content.',
          confidence: 'low',
        });
      }

      return results;
    },
  },

  {
    id: 'ES-18',
    name: 'Apertura de artículo formulaica',
    category: 'filler',
    langs: ['es'],
    description:
      'AI announces article structure before writing it. Almost never appears in human writing.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\ben este (artículo|post|texto|documento|ensayo) (vamos a|te |exploraremos|analizaremos|abordaremos|trataremos|veremos)\b/gi,
        /\ba lo largo de este (artículo|post|texto|documento|ensayo)\b/gi,
        /\ben las (siguientes|próximas) (líneas|páginas|secciones|palabras)\b/gi,
        /\beste (artículo|post|texto|documento) (tiene como objetivo|busca|pretende|se propone)\b/gi,
        /\ben esta (guía|entrada|publicación) (vamos a|exploraremos|analizaremos|abordaremos)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Start with the content directly — remove the meta-framing.', 'high'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-19',
    name: 'Cierre de chatbot español',
    category: 'communication',
    langs: ['es'],
    description: 'Closing phrases that expose chatbot origin. Almost never appear in human writing.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\bespero que (esto|esta información|esta respuesta|todo esto) te haya (sido útil|ayudado|servido)\b/gi,
        /\bespero haber (sido de ayuda|respondido (tu|su) pregunta|aclarado (tus|sus) dudas)\b/gi,
        /\bno dudes en (preguntar|consultarme|escribirme|contactarme)(?: de nuevo| otra vez)?\b/gi,
        /\bsi (tienes|tiene) (alguna )?(otra )?(pregunta|duda|consulta)\b/gi,
        /\b¿hay algo más en lo que (pueda|te pueda|le pueda) (ayudar|asistir)\b/gi,
        /\bquedo a (tu|su) (disposición|entera disposición)\b/gi,
        /\bha sido un placer (ayudarte|atenderte|responderte|asistirte)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, '(remove — end with actual content)', 'high'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-20',
    name: 'Clickbait de guía',
    category: 'content',
    langs: ['es'],
    description:
      'AI-generated article titles and section openers with clickbait formula patterns.',
    weight: 2,
    detect(text) {
      const patterns = [
        /\btodo lo que (necesitas|debes) saber (sobre|acerca de)\b/gi,
        /\bguía (completa|definitiva|esencial|práctica|paso a paso) (de|para|sobre)\b/gi,
        /\b\d+ (cosas|razones|claves|aspectos|formas|maneras|pasos|consejos|secretos|trucos|errores) (que|para|de|sobre|a evitar)\b/gi,
        /\blo que (nadie te cuenta|no te dicen|no sabes) (sobre|acerca de|de)\b/gi,
        /\b(todo|lo) que necesitas saber\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Write a specific, descriptive title instead.', 'medium'),
        );
      }
      return results;
    },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/patterns/es/patterns-es.test.js
```
Expected: All PASS.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```
Expected: All passing (new tests added, no regressions).

- [ ] **Step 6: Run `npm run check` (lint + format + tests)**

```bash
npm run check
```
Expected: All passing. If prettier reformats any code, stage the changes and re-run.

- [ ] **Step 7: Commit**

```bash
git add src/core/patterns/es.js tests/core/patterns/es/patterns-es.test.js
git commit -m "feat(es): add ES-17 (estructura), ES-18 (apertura artículo), ES-19 (cierre chatbot), ES-20 (clickbait)"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| TIER_1 +30 words (user-confirmed + analytical verbs + positive adj + corporate) | Task 1 |
| TIER_3 +33 words, remove `significativo` | Task 1 |
| AI_PHRASES +14 entries | Task 1 |
| ES-01 threshold 3→2 gerunds | Task 2 |
| ES-02 more vague openers | Task 2 |
| ES-03 expanded abstracts | Task 2 |
| ES-04 closing sycophancy | Task 3 |
| ES-07 more generic conclusions | Task 3 |
| ES-08 more vague attributions | Task 3 |
| ES-09 more positive language | Task 3 |
| ES-10 modal + ser passive | Task 3 |
| ES-11 Framing de análisis | Task 4 |
| ES-12 Copula avoidance | Task 4 |
| ES-13 Pregunta retórica | Task 4 |
| ES-14 Hedging excesivo | Task 5 |
| ES-15 Paralelismo negativo | Task 5 |
| ES-16 Desafíos formulaicos | Task 5 |
| ES-17 Estructura excesiva | Task 6 |
| ES-18 Apertura de artículo | Task 6 |
| ES-19 Cierre de chatbot | Task 6 |
| ES-20 Clickbait de guía | Task 6 |

All spec requirements covered. No placeholders. No TBDs.
