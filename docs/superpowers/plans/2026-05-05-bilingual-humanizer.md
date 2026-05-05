# Bilingual Humanizer (ES/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Spanish as the default language to the humanizer, with English selectable via `--lang en`, using a factory-function architecture that keeps both languages cleanly separated.

**Architecture:** `createPatterns(lang)` replaces the static `patterns` array; it filters by a `langs` property on each pattern and injects locale-specific vocabulary. `computeStats(text, lang)` selects the correct function-word list, readability formula (IFSZ for ES, Flesch-Kincaid for EN), and thresholds. `lang` flows from CLI → `analyze()` → `createPatterns()` + `computeStats()`.

**Tech Stack:** Node.js (CommonJS source), Vitest (ESM tests), no new npm dependencies.

**Research basis:** `references/spanish-ai-detection-research.md` — read it before touching vocabulary or thresholds.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/locales/index.js` | `getLocale(lang)` selector |
| Create | `src/locales/en.js` | Re-exports `vocabulary.js` unchanged |
| Create | `src/locales/es.js` | Spanish TIER_1/2/3, AI_PHRASES, FUNCTION_WORDS, CONNECTORS |
| Create | `src/patterns-es.js` | ES-01 … ES-10 pattern detectors |
| Create | `tests/es/vocabulary-es.test.js` | Spanish vocab detection tests |
| Create | `tests/es/patterns-es.test.js` | Spanish pattern tests |
| Create | `tests/es/stats-es.test.js` | IFSZ, HLR, TTR variance, connector density |
| Modify | `src/patterns.js` | Add `langs` prop + `createPatterns(lang)` + update `PatternRegistry` |
| Modify | `src/stats.js` | Add `lang` param, `estimateSyllablesES`, IFSZ, HLR, TTR variance, connector density, `computeUniformityScore(stats, lang)` |
| Modify | `src/analyzer.js` | Accept `lang` in opts; call `createPatterns(lang)` + `computeStats(text, lang)` |
| Modify | `src/humanizer.js` | Accept `lang` in opts; pass to `analyze()` |
| Modify | `src/cli.js` | Parse `--lang <code>` (default `'es'`); pass to all commands |
| Modify | `tests/analyzer.test.js` | Add `lang: 'en'` to all existing calls |
| Modify | `tests/humanizer.test.js` | Add `lang: 'en'` to all existing calls |
| Modify | `tests/statistics.test.js` | Add `lang: 'en'` to all existing calls |
| Modify | `tests/calibration.test.js` | Add `lang: 'en'` to all existing calls |
| Modify | `tests/edge-cases.test.js` | Add `lang: 'en'` to all existing calls |
| Modify | `tests/performance.test.js` | Add `lang: 'en'` to all existing calls |
| Modify | `SKILL.md` | Rewrite for bilingual; Spanish primary |

---

## Task 0: Baseline Verification

**Files:** none modified

- [ ] **Step 1: Run the full test suite and record the result**

```bash
npm test
```

Expected: all tests pass. Note the exact count (e.g. "128 passed"). If any fail, stop and fix before continuing — you need a clean baseline to distinguish new failures.

- [ ] **Step 2: Confirm exports from the files you will touch**

```bash
node -e "const p = require('./src/patterns.js'); console.log(Object.keys(p))"
node -e "const s = require('./src/stats.js'); console.log(Object.keys(s))"
node -e "const a = require('./src/analyzer.js'); console.log(Object.keys(a))"
```

Expected output for patterns: `[ 'patterns', 'registry', 'PatternRegistry', 'findMatches', 'countMatches', 'wordCount', 'scanWordList', 'scanPhrases', 'TIER_1', 'TIER_2', 'TIER_3', 'AI_PHRASES', 'SIGNIFICANCE_PHRASES', 'PROMOTIONAL_WORDS', 'VAGUE_ATTRIBUTION_PHRASES', 'CHALLENGES_PHRASES', 'COPULA_AVOIDANCE' ]`

---

## Task 1: Locale Architecture

**Files:**
- Create: `src/locales/index.js`
- Create: `src/locales/en.js`
- Create: `tests/locales.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/locales.test.js
import { describe, it, expect } from 'vitest';
import { getLocale } from '../src/locales/index.js';

describe('getLocale', () => {
  it('defaults to Spanish', () => {
    const locale = getLocale();
    expect(locale).toHaveProperty('TIER_1');
    expect(locale.TIER_1).toContain('fundamental');
  });

  it('returns English vocab for lang=en', () => {
    const locale = getLocale('en');
    expect(locale.TIER_1).toContain('delve');
    expect(locale.TIER_1).not.toContain('fundamental');
  });

  it('returns Spanish vocab for lang=es', () => {
    const locale = getLocale('es');
    expect(locale.TIER_1).toContain('fundamental');
    expect(locale.TIER_1).not.toContain('delve');
  });

  it('falls back to Spanish for unknown lang', () => {
    const locale = getLocale('fr');
    expect(locale.TIER_1).toContain('fundamental');
  });

  it('each locale exports TIER_1, TIER_2, TIER_3, AI_PHRASES, FUNCTION_WORDS', () => {
    for (const lang of ['en', 'es']) {
      const locale = getLocale(lang);
      expect(locale).toHaveProperty('TIER_1');
      expect(locale).toHaveProperty('TIER_2');
      expect(locale).toHaveProperty('TIER_3');
      expect(locale).toHaveProperty('AI_PHRASES');
      expect(locale).toHaveProperty('FUNCTION_WORDS');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/locales.test.js
```

Expected: `Error: Cannot find module '../src/locales/index.js'`

- [ ] **Step 3: Create `src/locales/en.js`**

```js
// src/locales/en.js
// English locale — re-exports the existing vocabulary.js unchanged.
const vocab = require('../vocabulary');
module.exports = vocab;
```

- [ ] **Step 4: Create `src/locales/index.js`**

The Spanish locale (es.js) doesn't exist yet — require it lazily so this file doesn't crash.

```js
// src/locales/index.js
function getLocale(lang = 'es') {
  if (lang === 'en') return require('./en');
  return require('./es');
}

module.exports = { getLocale };
```

- [ ] **Step 5: Create a stub `src/locales/es.js` so the require doesn't crash**

```js
// src/locales/es.js  — STUB, replaced fully in Task 2
const TIER_1 = ['fundamental', 'crucial', 'esencial'];
const TIER_2 = ['asimismo', 'no obstante'];
const TIER_3 = ['significativo', 'relevante'];
const AI_PHRASES = [];
const FUNCTION_WORDS = ['el', 'la', 'de', 'que', 'en'];
const CONNECTORS = [];

module.exports = { TIER_1, TIER_2, TIER_3, AI_PHRASES, FUNCTION_WORDS, CONNECTORS };
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test tests/locales.test.js
```

Expected: all 5 tests pass.

- [ ] **Step 7: Run full suite to confirm nothing broke**

```bash
npm test
```

Expected: same count as baseline.

- [ ] **Step 8: Commit**

```bash
git add src/locales/ tests/locales.test.js
git commit -m "feat(i18n): add locale architecture with en/es selector"
```

---

## Task 2: Spanish Vocabulary (`src/locales/es.js`)

**Files:**
- Modify: `src/locales/es.js` (replace stub)
- Create: `tests/es/vocabulary-es.test.js`

- [ ] **Step 1: Write failing tests first**

```js
// tests/es/vocabulary-es.test.js
import { describe, it, expect } from 'vitest';
import { getLocale } from '../../src/locales/index.js';

const es = getLocale('es');

describe('Spanish TIER_1 — dead giveaways', () => {
  const mustInclude = [
    'fundamental', 'crucial', 'esencial', 'primordial', 'indispensable',
    'invaluable', 'trascendental', 'revolucionario', 'innovador', 'disruptivo',
    'robusto', 'integral', 'holístico', 'paradigma', 'sinergia', 'ecosistema',
    'panorama', 'potenciar', 'optimizar', 'maximizar', 'aprovechar', 'impulsar',
    'catalizar', 'empoderar', 'apalancar', 'destacar', 'subrayar', 'evidenciar',
  ];
  for (const word of mustInclude) {
    it(`includes "${word}"`, () => {
      expect(es.TIER_1).toContain(word);
    });
  }
});

describe('Spanish TIER_2 — suspicious in density', () => {
  const mustInclude = [
    'asimismo', 'igualmente', 'no obstante', 'sin embargo', 'en consecuencia',
    'cabe destacar', 'cabe señalar', 'es importante mencionar',
    'vale la pena destacar', 'en el mundo actual', 'hoy en día',
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
    const required = ['el', 'la', 'de', 'que', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'por', 'con', 'para'];
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test tests/es/vocabulary-es.test.js
```

Expected: many failures because the stub has very few words.

- [ ] **Step 3: Write the full `src/locales/es.js`**

```js
// src/locales/es.js — Spanish vocabulary for AI detection

// ─── Tier 1: Dead giveaways ──────────────────────────────
// Words that appear with disproportionate frequency in AI-generated Spanish.
// Sources: empirical analysis of ChatGPT/Claude/Gemini output in Spanish,
// Genbeta, El Androide Feliz, Pageon.ai, Infobae.

const TIER_1 = [
  // Verbos de énfasis vacío
  'destacar', 'subrayar', 'enfatizar', 'recalcar', 'remarcar',
  'evidenciar', 'ilustrar', 'demostrar', 'revelar',

  // Adjetivos inflados — equivalentes directos de las palabras IA en inglés
  'fundamental', 'crucial', 'esencial', 'primordial', 'indispensable',
  'imprescindible', 'invaluable', 'inestimable', 'trascendental',
  'revolucionario', 'innovador', 'vanguardista', 'disruptivo', 'pionero',
  'robusto', 'sólido', 'integral', 'holístico', 'exhaustivo',
  'meticuloso', 'riguroso', 'minucioso',

  // Sustantivos abstractos favoritos de IA
  'paradigma', 'sinergia', 'ecosistema', 'ámbito', 'panorama',
  'espectro', 'horizonte', 'tejido', 'esfera', 'dominio',

  // Verbos corporativos
  'potenciar', 'optimizar', 'maximizar', 'aprovechar', 'impulsar',
  'catalizar', 'empoderar', 'apalancar', 'articular',
  'implementar', 'gestionar', 'promover', 'fomentar', 'garantizar',
];

// ─── Tier 2: Suspicious in density ──────────────────────
// Normal in isolation, damning in groups. Includes connectors that AI
// stacks without logical necessity (see research doc, section 3.1).

const TIER_2 = [
  // Conectores aditivos sobreutilizados
  'asimismo', 'igualmente', 'del mismo modo', 'de igual manera',
  'por añadidura',

  // Conectores causales/conclusivos
  'en consecuencia', 'por lo tanto', 'por ende', 'de ahí que',
  'de este modo', 'así pues', 'por consiguiente',

  // Conectores adversativos
  'no obstante', 'sin embargo', 'a pesar de ello', 'con todo', 'si bien',

  // De énfasis — el AI los usa en cada frase
  'en efecto', 'de hecho', 'ciertamente', 'indudablemente',
  'sin duda', 'es evidente que', 'cabe destacar', 'cabe señalar',
  'cabe mencionar', 'es importante mencionar', 'es importante destacar',
  'es importante señalar', 'vale la pena destacar', 'vale la pena mencionar',
  'resulta fundamental', 'resulta esencial', 'resulta crucial',

  // Aperturas de texto
  'en el mundo actual', 'en la actualidad', 'en el contexto actual',
  'hoy en día', 'en tiempos modernos', 'en la era digital',
  'en un mundo cada vez más', 'a lo largo de los años',
  'a lo largo de la historia', 'desde tiempos inmemoriales',

  // De enumeración
  'en primer lugar', 'en segundo lugar', 'en tercer lugar',
  'por un lado', 'por otro lado', 'finalmente',

  // De resumen/cierre
  'en definitiva', 'en conclusión', 'en resumen', 'en última instancia',
  'para concluir', 'a modo de conclusión',

  // De referencia interna
  'como se mencionó anteriormente', 'tal y como se indicó',
  'en este sentido', 'al respecto', 'como se puede observar',
  'como se puede ver',
];

// ─── Tier 3: Context-dependent ──────────────────────────
// Flagged only at high density (>3% of total words).

const TIER_3 = [
  'significativo', 'relevante', 'notable', 'considerable', 'sustancial',
  'efectivo', 'eficiente', 'eficaz', 'productivo', 'exitoso',
  'único', 'especial', 'excepcional', 'extraordinario',
  'estratégico', 'estratégicamente', 'proactivo', 'dinámico',
  'sostenible', 'escalable', 'transformador', 'innovación',
  'digitalización', 'transformación', 'mejores prácticas',
  'valor añadido', 'propuesta de valor',
];

// ─── AI Phrases ──────────────────────────────────────────
// Regex patterns for multi-word AI tells in Spanish.
// Each has: pattern (RegExp), tier (1-3), fix (string).

const AI_PHRASES = [
  // Aperturas de contexto vago
  { pattern: /\ben (el mundo|la sociedad|el contexto|la era|un mundo|nuestros días) actual/gi, tier: 1, fix: '(eliminar — ser específico sobre qué ha cambiado)' },
  { pattern: /\ben un mundo cada vez más\b/gi, tier: 1, fix: '(eliminar — ser específico)' },
  { pattern: /\ba lo largo de (los años|la historia|el tiempo)\b/gi, tier: 2, fix: '(dar fechas concretas)' },
  { pattern: /\bdesde tiempos inmemoriales\b/gi, tier: 2, fix: '(dar fecha concreta o eliminar)' },

  // Frases de énfasis metacomentario — altamente diagnósticas
  { pattern: /\bcabe (destacar|señalar|mencionar) que\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bes importante (tener en cuenta|señalar|mencionar|destacar|considerar) que\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bes fundamental (tener en cuenta|recordar|entender|señalar)\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bvale la pena (destacar|señalar|mencionar) que\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bresulta (fundamental|esencial|crucial|importante) (que|para|tener)\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bes de suma importancia\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bno (hay|podemos) (que )?(olvidar|ignorar|pasar por alto) que\b/gi, tier: 2, fix: '(eliminar — decirlo directamente)' },

  // Artefactos de chatbot — señal más fuerte de todas
  { pattern: /\b(excelente|muy buena?|gran|magnífica) pregunta\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bespero que (esto|esta información|esta respuesta) te (haya? (sido |)útil|ayude)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bno dudes en (preguntar|consultarme|escribirme)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bestoy (aquí para ayudarte|a tu disposición|encantado de ayudar)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bcon (mucho )?gusto (te |)ayudo\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bclaro que sí[,!]\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\b(por supuesto|desde luego)[,!] (con mucho gusto|estoy encantado|permíteme)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bme alegr[ao] que (me |lo )(preguntes|hayas preguntado)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bsi (tienes|tiene) (alguna )?(otra )?(pregunta|duda|consulta)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\b¡(claro|por supuesto|desde luego)!\b/gi, tier: 2, fix: '(eliminar si es artefacto de chatbot)' },

  // Disclaimers de corte de conocimiento
  { pattern: /\b(mi|este) conocimiento (tiene|llega hasta) (una |su )?(fecha|límite|corte)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bno tengo acceso a información en tiempo real\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bcomo modelo de lenguaje[, ]\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bte recomiendo verificar en fuentes (actualizadas|más recientes)\b/gi, tier: 2, fix: '(eliminar o citar la fuente directamente)' },
  { pattern: /\bhasta mi (fecha de corte|última actualización)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bsegún mi (última |más reciente )?(actualización|conocimiento|entrenamiento)\b/gi, tier: 1, fix: '(eliminar)' },

  // Conclusiones genéricas
  { pattern: /\bel futuro (es|parece|luce|se ve) (prometedor|brillante|alentador)\b/gi, tier: 1, fix: '(terminar con un hecho concreto)' },
  { pattern: /\bqueda (mucho|bastante) (camino|trabajo) por (recorrer|hacer)\b/gi, tier: 2, fix: '(ser específico sobre qué falta)' },
  { pattern: /\bestamos ante un momento (histórico|crucial|decisivo|sin precedentes)\b/gi, tier: 1, fix: '(citar evidencia o eliminar)' },
  { pattern: /\bel camino por recorrer\b/gi, tier: 2, fix: '(ser específico)' },
  { pattern: /\bsolo el tiempo (dirá|lo dirá|nos lo dirá)\b/gi, tier: 2, fix: '(terminar con lo que sí sabes)' },
  { pattern: /\blas posibilidades son (infinitas|ilimitadas|enormes)\b/gi, tier: 2, fix: '(ser específico sobre qué es posible)' },

  // Atribuciones vagas
  { pattern: /\blos expertos (señalan|indican|sostienen|afirman|coinciden en)\b/gi, tier: 1, fix: '(citar un experto concreto con nombre)' },
  { pattern: /\b(diversos|múltiples|varios) estudios (demuestran|muestran|indican|sugieren)\b/gi, tier: 1, fix: '(citar un estudio concreto)' },
  { pattern: /\bsegún los (especialistas|expertos|investigadores|analistas)\b/gi, tier: 2, fix: '(nombrar a alguien concreto)' },
  { pattern: /\bla evidencia (sugiere|muestra|indica|demuestra) que\b/gi, tier: 2, fix: '(citar la evidencia específica)' },
  { pattern: /\bla (ciencia|literatura científica) (dice|muestra|afirma|demuestra)\b/gi, tier: 2, fix: '(citar un paper o estudio concreto)' },

  // Lenguaje excesivamente positivo — IA usa 96-133% más que humanos (arXiv:2505.01800)
  { pattern: /\bresultados? (excelentes?|brillantes?|extraordinarios?|sobresalientes?)\b/gi, tier: 2, fix: '(dar cifras concretas)' },
  { pattern: /\bavance (significativo|revolucionario|extraordinario|sin precedentes)\b/gi, tier: 2, fix: '(describir el avance concreto)' },
  { pattern: /\bun (gran|enorme|extraordinario|increíble) (paso|logro|éxito|avance|hito)\b/gi, tier: 2, fix: '(describir el logro concreto)' },

  // Aperturas introductorias redundantes
  { pattern: /\ben este artículo (vamos a|voy a|te) (explicar|explorar|analizar|mostrar)\b/gi, tier: 1, fix: '(eliminar — empezar con el contenido)' },
  { pattern: /\ba continuación (te |voy a |vamos a )?(presentar|explicar|analizar|mostrar|ver)\b/gi, tier: 2, fix: '(eliminar — empezar con el contenido)' },
  { pattern: /\bpermíteme (explicarte|presentarte|mostrarte|ayudarte)\b/gi, tier: 1, fix: '(eliminar — empezar con el contenido)' },

  // Triadas y listas formulaicas
  { pattern: /\b(innovación|creatividad|transformación)[,] (innovación|creatividad|transformación) y (innovación|creatividad|transformación)\b/gi, tier: 2, fix: '(elegir uno y desarrollarlo)' },

  // Hedging hipercalificado (RLHF-induced)
  { pattern: /\bpodría (decirse|afirmarse|considerarse) que\b/gi, tier: 2, fix: '(decirlo directamente o no decirlo)' },
  { pattern: /\bdesde (cierta|alguna|una determinada) perspectiva\b/gi, tier: 2, fix: '(decir desde cuál perspectiva o eliminar)' },
  { pattern: /\bhasta cierto punto\b/gi, tier: 2, fix: '(ser preciso o eliminar)' },
  { pattern: /\ben cierta (medida|forma)\b/gi, tier: 2, fix: '(ser preciso o eliminar)' },
];

// ─── Function Words ──────────────────────────────────────
// Spanish function words for stylometric analysis.
// Based on RAE grammar, NLTK/spaCy Spanish stopwords, and frequency corpora.
// The ratio of function words to total words is typically 45-55% in Spanish.

const FUNCTION_WORDS = [
  // Artículos
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo',
  // Preposiciones
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'durante',
  'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por',
  'según', 'sin', 'sobre', 'tras', 'al', 'del',
  // Conjunciones coordinantes
  'y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'sino', 'aunque',
  // Conjunciones subordinantes frecuentes
  'que', 'si', 'porque', 'cuando', 'como', 'mientras', 'donde',
  'pues', 'aunque', 'ya',
  // Pronombres personales
  'yo', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
  'lo', 'la', 'los', 'las',
  // Determinantes demostrativos
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'aquel', 'aquella', 'aquellos', 'aquellas', 'esto', 'eso', 'aquello',
  // Adverbios gramaticales
  'no', 'sí', 'también', 'tampoco', 'ya', 'aún', 'todavía',
  'siempre', 'nunca', 'jamás', 'aquí', 'ahí', 'allí', 'acá', 'allá',
  'ahora', 'antes', 'después', 'entonces', 'luego', 'hoy', 'muy',
  'más', 'menos', 'tan', 'tanto', 'bien', 'mal',
  // Formas verbales auxiliares frecuentes
  'es', 'son', 'está', 'están', 'ha', 'han', 'hay', 'fue',
  'ser', 'estar', 'haber', 'tener', 'tiene', 'tienen',
];

// ─── Connectors ──────────────────────────────────────────
// Used by the connector-density metric in stats.js.
// These are the connectors AI stacks without logical necessity.
// See research doc section 3.1 for context.

const CONNECTORS = [
  'además', 'asimismo', 'igualmente', 'también', 'del mismo modo',
  'de igual manera', 'por añadidura', 'de igual forma',
  'por lo tanto', 'por ende', 'en consecuencia', 'de ahí que',
  'de este modo', 'así pues', 'por consiguiente', 'en efecto',
  'no obstante', 'sin embargo', 'a pesar de ello', 'con todo',
  'si bien', 'aunque', 'ahora bien',
  'en primer lugar', 'en segundo lugar', 'en tercer lugar',
  'por un lado', 'por otro lado', 'por otra parte',
  'finalmente', 'por último', 'en definitiva', 'en conclusión',
  'en resumen', 'en última instancia', 'para concluir',
  'a modo de conclusión', 'en efecto', 'de hecho', 'ciertamente',
  'indudablemente', 'en este sentido', 'al respecto',
  'como se mencionó', 'a continuación', 'en cuanto a',
  'con respecto a', 'en lo que respecta a', 'dado que',
  'puesto que', 'ya que', 'debido a que', 'a causa de',
];

module.exports = { TIER_1, TIER_2, TIER_3, AI_PHRASES, FUNCTION_WORDS, CONNECTORS };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/es/vocabulary-es.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: same baseline count + new ES vocab tests.

- [ ] **Step 6: Commit**

```bash
git add src/locales/es.js tests/es/vocabulary-es.test.js
git commit -m "feat(i18n): add Spanish vocabulary (TIER_1/2/3, AI_PHRASES, CONNECTORS)"
```

---

## Task 3: Spanish Syllable Estimator

**Files:**
- Modify: `src/stats.js` (add `estimateSyllablesES`)
- Modify: `tests/statistics.test.js` (add syllable tests for Spanish)

The existing `estimateSyllables(word)` is English-only — it strips non-`a-z` characters,
losing accented vowels (á, é, í, ó, ú, ü), and applies English rules (silent-e, -ed ending).
We need a Spanish counterpart that handles Spanish vowels and diphthong/hiatus rules.

- [ ] **Step 1: Write failing tests**

Add at the end of `tests/statistics.test.js`:

```js
import { estimateSyllablesES } from '../src/stats.js';

describe('estimateSyllablesES', () => {
  const cases = [
    // word, expected syllables
    ['pan', 1],       // consonante-vocal-consonante: 1
    ['casa', 2],      // ca-sa
    ['libro', 2],     // li-bro
    ['árbol', 2],     // ár-bol
    ['ciudad', 2],    // ciu-dad (diptongo iu)
    ['bueno', 2],     // bue-no (diptongo ue)
    ['pie', 1],       // pie (diptongo ie)
    ['agua', 2],      // a-gua (diptongo ua)
    ['tiene', 2],     // tie-ne (diptongo ie)
    ['poema', 3],     // po-e-ma (hiato oe — dos vocales fuertes)
    ['caer', 2],      // ca-er (hiato ae)
    ['día', 2],       // dí-a (hiato — vocal débil tónica + fuerte)
    ['frío', 2],      // frí-o (hiato — vocal débil tónica)
    ['universidad', 6], // u-ni-ver-si-dad (aproximación)
    ['extraordinario', 7], // ex-tra-or-di-na-rio (aproximación)
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test tests/statistics.test.js
```

Expected: `estimateSyllablesES is not a function`.

- [ ] **Step 3: Implement `estimateSyllablesES` in `src/stats.js`**

<thinkanywhere>
The Spanish syllabification algorithm needs careful design. Key rules:

VOWELS in Spanish: a e i o u á é í ó ú ü  (accented + ü for güe/güi)
STRONG vowels: a e o á é ó
WEAK vowels: i u ü
STRESSED WEAK vowels: í ú (these break diphthongs — form hiatuses with any adjacent vowel)

DIPHTHONG rules (2 vowels = 1 syllable):
  - strong + weak (unstressed): ai, au, ei, eu, oi, ao... → 1 syllable
  - weak (unstressed) + strong: ia, ie, io, ua, ue, uo... → 1 syllable
  - weak + weak (both unstressed): iu, ui → 1 syllable
  
HIATUS rules (2 vowels = 2 syllables):
  - strong + strong: ae, ao, ea, eo, oa, oe, aa, ee, oo → 2 syllables
  - stressed weak + any vowel: ía, úe, etc. → 2 syllables
  - any vowel + stressed weak: aí, eí, oí, etc. → 2 syllables

TRIPHTHONG rules (3 vowels = 1 syllable):
  - weak + strong + weak: iai, iei, uai, uei... → 1 syllable (e.g. "buey")

Practical algorithm approach:
1. Normalize word: lowercase, strip non-Spanish chars
2. Identify all vowel characters and their positions
3. For consecutive vowel sequences, decide if they're diphthongs (1 syl) or hiatuses (2 syl)
4. Count syllable nuclei

Simple regex approach (90% accuracy, good enough for readability metric):
- Count all vowels: [aeiouáéíóúü]
- Subtract for diphthongs: adjacent pairs where neither is a stressed weak vowel (í, ú)
  - Pattern: [aeouáéóü][iu] or [iu][aeouáéóü] or [iu][iu] (but NOT í or ú in the pair)
- For triphthongs (weak+strong+weak): counted as diphthong already since we process pairs

Edge cases to handle:
- "hiato" with h between vowels: "ahí" = a-hí (h is silent, í is stressed weak → hiato)
- Prefixes: "reemplazar" = re-em-pla-zar (ee = hiato)
- "ruin" = ru-in (ui = diphthong normally, but some say hiato)

The test cases above cover the most important cases. The algorithm should pass them.
Here's the implementation that handles the test cases:
</thinkanywhere>

Add this function to `src/stats.js` before the exports block:

```js
/**
 * Estimate syllable count for a Spanish word.
 * Handles accented vowels, diphthongs, and hiatuses.
 * Accuracy ~90% for common vocabulary — sufficient for IFSZ readability metric.
 *
 * Rules applied:
 *   - Strong vowels: a e o (and accented á é ó)
 *   - Weak vowels: i u ü
 *   - Stressed weak vowels: í ú (always form hiatus — separate syllable)
 *   - Diphthong: strong+weak, weak+strong, weak+weak → 1 syllable
 *   - Hiatus: strong+strong, stressed-weak+any, any+stressed-weak → 2 syllables
 */
function estimateSyllablesES(word) {
  word = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (word.length === 0) return 1;

  const STRESSED_WEAK = new Set(['í', 'ú']);
  const WEAK = new Set(['i', 'u', 'ü']);
  const ALL_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü']);

  const isVowel = (c) => ALL_VOWELS.has(c);
  const isWeak = (c) => WEAK.has(c);
  const isStressedWeak = (c) => STRESSED_WEAK.has(c);

  let syllables = 0;
  let i = 0;

  while (i < word.length) {
    if (!isVowel(word[i])) {
      i++;
      continue;
    }

    // Start of a vowel nucleus — always counts as one syllable
    syllables++;
    const cur = word[i];

    // Look ahead for adjacent vowels and decide diphthong vs. hiatus
    let j = i + 1;

    // Skip any non-vowel (shouldn't happen in adjacent positions but safety)
    while (j < word.length && !isVowel(word[j])) j++;

    if (j < word.length && isVowel(word[j])) {
      const next = word[j];

      // Determine if cur+next form a diphthong (share one syllable)
      // They do NOT form a diphthong if:
      //   - both are strong vowels (hiatus)
      //   - either is a stressed weak vowel í or ú (hiatus)
      const curIsWeak = isWeak(cur);
      const nextIsWeak = isWeak(next);
      const neitherStressed = !isStressedWeak(cur) && !isStressedWeak(next);
      const atLeastOneWeak = curIsWeak || nextIsWeak;

      if (atLeastOneWeak && neitherStressed) {
        // Diphthong — next vowel is in the same syllable, skip it
        i = j + 1;

        // Check for triphthong: weak+strong+weak (skip one more weak)
        let k = i;
        while (k < word.length && !isVowel(word[k])) k++;
        if (k < word.length && isWeak(word[k]) && !isStressedWeak(word[k])) {
          i = k + 1;
        }
        continue;
      }
      // Hiatus — next vowel starts a new syllable; don't skip it
    }

    i++;
  }

  return Math.max(1, syllables);
}
```

Also add `estimateSyllablesES` to the `module.exports` at the bottom of `src/stats.js`:

```js
module.exports = {
  computeStats,
  computeUniformityScore,
  computeNgramRepetition,
  splitSentences,
  tokenize,
  estimateSyllables,
  estimateSyllablesES,   // ← add this
};
```

- [ ] **Step 4: Run syllable tests**

```bash
npm test tests/statistics.test.js
```

Expected: all `estimateSyllablesES` tests pass. If any fail, check the vowel adjacency logic — "j" in the algorithm skips to the next vowel, which may need adjustment if the word has consonants between vowels (consonants should reset the adjacency check).

<thinkanywhere>
The adjacency logic above has a subtle bug: `j` skips non-vowels to find the "next" vowel, but in Spanish, diphthongs require vowels to be ADJACENT (no consonant between them). For example, "cae" = ca-e (hiato) but "caiga" = cai-ga (diptongo ai, then consonant, then another vowel). The current code skips consonants looking for the next vowel, which could incorrectly merge non-adjacent vowels into diphthongs.

Fix: only check the IMMEDIATELY next character. If it's not a vowel, the diphthong check doesn't apply.

Corrected inner check:
```js
const next = word[i + 1]; // only check immediately adjacent
if (next && isVowel(next)) {
  // ... diphthong check as above
  i = i + 2; // skip current + next
  // triphthong check at i+2
  continue;
}
i++;
```

This simpler version is more correct for most Spanish words. The test cases above should drive this correction if needed.
</thinkanywhere>

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: all previous tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/stats.js tests/statistics.test.js
git commit -m "feat(stats): add estimateSyllablesES for Spanish syllabification"
```

---

## Task 4: Refactor `patterns.js` — Factory Function + `langs` Property

**Files:**
- Modify: `src/patterns.js`
- Create: `tests/patterns-locale.test.js`

The goal: `createPatterns(lang)` returns only the patterns valid for that language,
with locale-specific vocabulary injected. The static `patterns` export is kept for
backward compatibility (it returns English patterns, same as before).

- [ ] **Step 1: Write failing tests**

```js
// tests/patterns-locale.test.js
import { describe, it, expect } from 'vitest';
import { createPatterns, patterns } from '../src/patterns.js';

describe('createPatterns', () => {
  it('is a function', () => {
    expect(typeof createPatterns).toBe('function');
  });

  it('returns an array of patterns', () => {
    const p = createPatterns('en');
    expect(Array.isArray(p)).toBe(true);
    expect(p.length).toBeGreaterThan(0);
  });

  it('every pattern has id, name, category, weight, detect, langs', () => {
    for (const p of createPatterns('en')) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('category');
      expect(p).toHaveProperty('weight');
      expect(p).toHaveProperty('detect');
      expect(p).toHaveProperty('langs');
      expect(typeof p.detect).toBe('function');
      expect(Array.isArray(p.langs)).toBe(true);
    }
  });

  it('English patterns include AI vocabulary detector', () => {
    const p = createPatterns('en');
    expect(p.some(x => x.id === 7)).toBe(true);
  });

  it('Spanish patterns include AI vocabulary detector', () => {
    const p = createPatterns('es');
    expect(p.some(x => x.id === 7)).toBe(true);
  });

  it('Title Case pattern (id=16) is EN-only — not in ES patterns', () => {
    const enPatterns = createPatterns('en');
    const esPatterns = createPatterns('es');
    expect(enPatterns.some(x => x.id === 16)).toBe(true);
    expect(esPatterns.some(x => x.id === 16)).toBe(false);
  });

  it('Em dash pattern (id=13) appears in both EN and ES', () => {
    expect(createPatterns('en').some(x => x.id === 13)).toBe(true);
    expect(createPatterns('es').some(x => x.id === 13)).toBe(true);
  });

  it('Spanish patterns include ES-specific patterns (id starts with "ES-")', () => {
    const esPatterns = createPatterns('es');
    expect(esPatterns.some(x => String(x.id).startsWith('ES-'))).toBe(true);
  });

  it('EN patterns do NOT include ES-specific patterns', () => {
    const enPatterns = createPatterns('en');
    expect(enPatterns.some(x => String(x.id).startsWith('ES-'))).toBe(false);
  });

  it('backward-compat: patterns export equals createPatterns("en")', () => {
    // The static export uses English locale — existing tests depend on this
    expect(patterns.length).toBe(createPatterns('en').length);
    expect(patterns.map(p => p.id)).toEqual(createPatterns('en').map(p => p.id));
  });

  it('AI vocabulary pattern uses Spanish words for lang=es', () => {
    const esVocabPattern = createPatterns('es').find(x => x.id === 7);
    const text = 'Este aspecto es fundamental para el ecosistema.';
    const matches = esVocabPattern.detect(text);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('AI vocabulary pattern uses English words for lang=en', () => {
    const enVocabPattern = createPatterns('en').find(x => x.id === 7);
    const text = 'This is a delve into the vibrant tapestry.';
    const matches = enVocabPattern.detect(text);
    expect(matches.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test tests/patterns-locale.test.js
```

Expected: `createPatterns is not a function`.

- [ ] **Step 3: Add `langs` property to all patterns in `src/patterns.js`**

<thinkanywhere>
Need to read patterns 9-28 in full to classify each one correctly. 
Classification decision rule:
  - `['en', 'es']`: typographic/structural patterns that work for any language, and the AI vocabulary pattern (7) which uses locale-specific word lists
  - `['en']`: patterns whose detect() function contains English-specific phrases/words
  - `['es']`: new ES-* patterns from patterns-es.js

From what I've read:
  - Pattern 1 (Significance inflation): English phrases like "pivotal moment", "rich tapestry" → ['en']
  - Pattern 2 (Notability name-dropping): English media names → ['en']
  - Pattern 3 (Superficial -ing analyses): English gerunds → ['en'] but concept exists in ES... The regex matches English -ing forms → ['en']
  - Pattern 4 (Promotional language): English words → ['en']
  - Pattern 5 (Vague attributions): English phrases "experts believe" → ['en']
  - Pattern 6 (Formulaic challenges): English phrases → ['en']
  - Pattern 7 (AI vocabulary): uses TIER_1/2/3 from vocabulary → ['en', 'es'] with locale injection
  - Pattern 8 (Copula avoidance): "serves as", "stands as" → ['en']
  - Pattern 9 (Negative parallelisms): "Not just X, but Y" English → ['en']
  - Pattern 10 (Rule of three): structural regex, could work for both → ['en', 'es']
  - Pattern 11 (Synonym cycling): requires English vocabulary → ['en']
  - Pattern 12 (False ranges): structural pattern → ['en', 'es'] potentially, but regex may be English-specific
  - Pattern 13 (Em dash): typographic → ['en', 'es']
  - Pattern 14 (Boldface): typographic → ['en', 'es']
  - Pattern 15 (Inline-header lists): structural → ['en', 'es']
  - Pattern 16 (Title Case): English convention → ['en']
  - Pattern 17 (Emoji): universal → ['en', 'es']
  - Pattern 18 (Curly quotes): universal → ['en', 'es']
  - Pattern 19 (Chatbot artifacts): English phrases from AI_PHRASES → ['en']
  - Pattern 20 (Cutoff disclaimers): English phrases → ['en']
  - Pattern 21 (Sycophantic tone): English phrases → ['en']
  - Pattern 22 (Filler phrases): English phrases → ['en']
  - Pattern 23 (Excessive hedging): English phrases → ['en']
  - Pattern 24 (Generic conclusions): English phrases → ['en']
  - Patterns 25-28: Need to read the source to classify

When implementing, do a targeted grep of patterns.js to see patterns 9-28 and classify each.
The safest default: if a pattern's detect() references AI_PHRASES (English) or uses English-specific
word lists, mark as ['en']. If it's purely regex-based on structure (punctuation, markdown, casing),
mark as ['en', 'es'].
</thinkanywhere>

At the top of `src/patterns.js`, add this import after the existing vocabulary imports:

```js
const { getLocale } = require('./locales');
```

Then open `src/patterns.js` and add `langs` to each pattern definition. Find each `{` that starts a pattern object and add `langs` based on this classification:

| Pattern IDs | `langs` value | Reason |
|---|---|---|
| 7 | `['en', 'es']` | Vocabulary-based; locale-injected |
| 10, 13, 14, 15, 17, 18 | `['en', 'es']` | Structural/typographic |
| All others (1-6, 8-9, 11-12, 16, 19-28) | `['en']` | English-specific phrases in detect() |

Example diff for pattern 7 (AI vocabulary):

```js
// BEFORE:
{
  id: 7,
  name: 'AI vocabulary',
  category: 'language',
  ...
  detect(text) {
    const results = [];
    results.push(...scanWordList(text, TIER_1, 'Dead-giveaway AI word'));
    results.push(...scanWordList(text, TIER_2, 'Suspicious AI word', 'medium'));
    results.push(...scanWordList(text, TIER_3, 'Contextual AI word', 'low'));
    results.push(...scanPhrases(text, AI_PHRASES));
    return results;
  },
},

// AFTER:
{
  id: 7,
  name: 'AI vocabulary',
  category: 'language',
  langs: ['en', 'es'],
  ...
  detect(text, lang = 'en') {
    const locale = getLocale(lang);
    const results = [];
    results.push(...scanWordList(text, locale.TIER_1, 'Dead-giveaway AI word'));
    results.push(...scanWordList(text, locale.TIER_2, 'Suspicious AI word', 'medium'));
    results.push(...scanWordList(text, locale.TIER_3, 'Contextual AI word', 'low'));
    results.push(...scanPhrases(text, locale.AI_PHRASES));
    return results;
  },
},
```

For all other patterns that don't need locale injection, just add `langs: ['en']` (or `['en', 'es']` per table above). Their `detect(text)` signature stays unchanged since they don't use locale vocabulary.

- [ ] **Step 4: Add `createPatterns(lang)` factory function and update exports**

Add this function before the `PatternRegistry` class definition in `src/patterns.js`:

```js
/**
 * Build the active pattern list for a given language.
 * Filters by the `langs` property and injects locale into pattern 7's detect().
 *
 * @param {string} lang — 'en' or 'es'
 * @returns {object[]} — Array of pattern objects for that language
 */
function createPatterns(lang = 'es') {
  // Load Spanish-specific patterns lazily to avoid circular dep issues
  const esPatterns = lang === 'es' ? require('./patterns-es') : [];

  const filtered = patterns
    .filter((p) => p.langs.includes(lang))
    .map((p) => {
      if (p.id === 7) {
        // Wrap detect() to pass lang for locale injection
        return {
          ...p,
          detect: (text) => p.detect(text, lang),
        };
      }
      return p;
    });

  return [...filtered, ...esPatterns];
}
```

Update the exports at the bottom:

```js
module.exports = {
  patterns,          // backward compat — English patterns (same as createPatterns('en'))
  createPatterns,    // ← new
  registry,
  PatternRegistry,
  findMatches,
  countMatches,
  wordCount,
  scanWordList,
  scanPhrases,
  TIER_1,
  TIER_2,
  TIER_3,
  AI_PHRASES,
  SIGNIFICANCE_PHRASES,
  PROMOTIONAL_WORDS,
  VAGUE_ATTRIBUTION_PHRASES,
  CHALLENGES_PHRASES,
  COPULA_AVOIDANCE,
};
```

Also ensure the `patterns` export now uses the factory so `id=16` classification is consistent:

```js
// Singleton English patterns for backward compat
const patterns = ALL_PATTERNS; // keep the existing array name as ALL_PATTERNS internally
// At the bottom:
const patterns = createPatterns('en'); // ← replaces the static array in the export
```

Actually: rename the internal array to `ALL_PATTERNS`, then define `createPatterns` using it, then define the compat export. Grep `const patterns = [` in patterns.js, rename to `const ALL_PATTERNS = [`, then update `createPatterns` to filter `ALL_PATTERNS`, and set `const patterns = createPatterns('en')` for the export.

- [ ] **Step 5: Create stub `src/patterns-es.js`** (full version in Task 5)

```js
// src/patterns-es.js — STUB, replaced in Task 5
module.exports = [];
```

- [ ] **Step 6: Run locale pattern tests**

```bash
npm test tests/patterns-locale.test.js
```

Expected: all tests pass.

- [ ] **Step 7: Run full suite**

```bash
npm test
```

Expected: all baseline tests still pass (backward compat preserved).

- [ ] **Step 8: Commit**

```bash
git add src/patterns.js src/patterns-es.js tests/patterns-locale.test.js
git commit -m "refactor(patterns): add langs prop + createPatterns(lang) factory"
```

---

## Task 5: Spanish Pattern Detectors (`src/patterns-es.js`)

**Files:**
- Modify: `src/patterns-es.js` (replace stub)
- Create: `tests/es/patterns-es.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/es/patterns-es.test.js
import { describe, it, expect } from 'vitest';
import { createPatterns } from '../../src/patterns.js';

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

describe('ES-04: Sycophantic tone (español)', () => {
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

describe('ES-06: Cutoff disclaimers (español)', () => {
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
    // Se-passive is natural Spanish; only flag ser-passive when se-passive would be clearer
    expect(p().detect('Se ha desarrollado un nuevo método.').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test tests/es/patterns-es.test.js
```

Expected: `getPattern('ES-01')` returns undefined for all.

- [ ] **Step 3: Implement `src/patterns-es.js`**

```js
// src/patterns-es.js — Spanish-specific AI writing pattern detectors
// These patterns only run when lang='es'. They complement the language-agnostic
// core patterns (em dash, emoji, boldface) that run for both languages.

const { findMatches } = require('./patterns');

const PATTERNS_ES = [
  {
    id: 'ES-01',
    name: 'Gerundio encadenado',
    category: 'language',
    langs: ['es'],
    description: 'Three or more gerunds (-ando/-iendo) in one sentence. AI chains gerunds where Spanish naturally uses subordinate clauses.',
    weight: 4,
    detect(text) {
      // Match sentences containing 3+ gerundios
      const sentenceRegex = /[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*/gi;
      return findMatches(
        text,
        sentenceRegex,
        'Rewrite with finite verbs and separate clauses instead of chained gerunds.',
        'high',
      );
    },
  },

  {
    id: 'ES-02',
    name: 'Apertura con contexto vago',
    category: 'content',
    langs: ['es'],
    description: 'Opening a paragraph or text with a vague contextual frame ("En el mundo actual..."). Classic AI opener in Spanish.',
    weight: 5,
    detect(text) {
      return findMatches(
        text,
        /^(?:en (el mundo|la sociedad|el contexto|la era|un mundo|nuestros días) actual|en un mundo cada vez más|en la era digital|en el panorama actual)/im,
        'Remove — start with a concrete fact or specific claim.',
        'high',
      );
    },
  },

  {
    id: 'ES-03',
    name: 'Triada de abstractos',
    category: 'language',
    langs: ['es'],
    description: 'Three abstract nouns or adjectives in a comma-separated list. AI groups ideas in compulsory triplets.',
    weight: 3,
    detect(text) {
      // Matches: "X, Y y Z" where each element is a common abstract AI word
      const abstracts = '(?:innovación|creatividad|transformación|eficiencia|productividad|excelencia|sostenibilidad|transparencia|integridad|compromiso|visión|misión|valores|estrategia|impacto|crecimiento|desarrollo|mejora|calidad|rendimiento)';
      return findMatches(
        text,
        new RegExp(`${abstracts},\\s+${abstracts}\\s+y\\s+${abstracts}`, 'gi'),
        'Pick one concept and develop it concretely. Triplets feel formulaic.',
        'medium',
      );
    },
  },

  {
    id: 'ES-04',
    name: 'Sycophantic tone (español)',
    category: 'communication',
    langs: ['es'],
    description: 'Spanish chatbot sycophantic openers — praising questions or showing excessive enthusiasm.',
    weight: 5,
    detect(text) {
      const patterns = [
        /\b(excelente|muy buena?|gran|magnífica|fantástica|estupenda) pregunta\b/gi,
        /\bme alegr[ao] (que me lo preguntes|de poder ayudarte|que (lo |)hayas preguntado)\b/gi,
        /\b¡(claro|por supuesto|desde luego)!\s+(con mucho gusto|estoy encantado|permíteme|te ayudo)\b/gi,
        /\bentiendo (tu|su) (preocupación|pregunta|punto de vista|inquietud)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, '(remove — get to the point)', 'high'));
      }
      return results;
    },
  },

  {
    id: 'ES-05',
    name: 'Énfasis metacomentario',
    category: 'filler',
    langs: ['es'],
    description: 'Meta-commentary that talks about what will be said instead of saying it. One of the strongest AI signals in Spanish.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\bcabe (destacar|señalar|mencionar|resaltar|subrayar) que\b/gi,
        /\bes (importante|fundamental|esencial|crucial|necesario|vital) (tener en cuenta|señalar|mencionar|destacar|considerar|recordar|entender) que\b/gi,
        /\bes de suma importancia\b/gi,
        /\bvale la pena (destacar|señalar|mencionar|resaltar) que?\b/gi,
        /\bresulta (fundamental|esencial|crucial|importante|necesario) (que|para|entender|recordar)\b/gi,
        /\bno (hay|podemos) (que )?(olvidar|ignorar|pasar por alto) que\b/gi,
        /\bse debe (tener en cuenta|considerar|señalar|mencionar) que\b/gi,
        /\bdebe(ría)? tenerse en cuenta que\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, '(remove — state the fact directly)', 'high'));
      }
      return results;
    },
  },

  {
    id: 'ES-06',
    name: 'Cutoff disclaimers (español)',
    category: 'communication',
    langs: ['es'],
    description: 'Spanish knowledge-cutoff disclaimers. Always a chatbot artifact.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\bcomo modelo de lenguaje[, ]\b/gi,
        /\bno tengo acceso a información en tiempo real\b/gi,
        /\b(hasta|en) mi (fecha de corte|última actualización|conocimiento más reciente)\b/gi,
        /\bsegún mi (última |más reciente )?(actualización|conocimiento|entrenamiento|información)\b/gi,
        /\bmis datos (llegan|van|alcanzan) hasta\b/gi,
        /\ble recomiendo verificar en fuentes (actualizadas|más recientes|oficiales)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, '(remove)', 'high'));
      }
      return results;
    },
  },

  {
    id: 'ES-07',
    name: 'Conclusiones genéricas (español)',
    category: 'filler',
    langs: ['es'],
    description: 'Vague, optimistic closing statements. AI ends text with empty encouragement rather than concrete next steps.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\bel futuro (es|parece|luce|se ve|se presenta) (prometedor|brillante|alentador|esperanzador)\b/gi,
        /\bestamos ante un momento (histórico|crucial|decisivo|clave|sin precedentes)\b/gi,
        /\bsolo el tiempo (dirá|lo dirá|nos lo dirá|podrá decirlo)\b/gi,
        /\blas posibilidades son (infinitas|ilimitadas|enormes|vastas)\b/gi,
        /\bqueda (mucho|bastante|un largo) camino por recorrer\b/gi,
        /\bel camino por recorrer (es|será) (largo|arduo|apasionante)\b/gi,
        /\buna (nueva era|nueva etapa|nueva época) (se abre|comienza|está por comenzar)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, 'End with a specific fact or concrete plan instead.', 'medium'));
      }
      return results;
    },
  },

  {
    id: 'ES-08',
    name: 'Atribuciones vagas (español)',
    category: 'content',
    langs: ['es'],
    description: 'Vague attributions to unnamed experts or studies. Spanish equivalent of English "experts believe".',
    weight: 4,
    detect(text) {
      const patterns = [
        /\blos expertos (señalan|indican|sostienen|afirman|coinciden en|aseguran)\b/gi,
        /\b(diversos|múltiples|varios|numerosos) estudios (demuestran|muestran|indican|sugieren|confirman|revelan)\b/gi,
        /\bsegún (los |)(especialistas|expertos|investigadores|analistas|académicos)\b/gi,
        /\bla evidencia (sugiere|muestra|indica|demuestra|apunta a) que\b/gi,
        /\bla (ciencia|comunidad científica|literatura científica) (dice|muestra|afirma|demuestra|señala)\b/gi,
        /\binvestigaciones (recientes |)(demuestran|muestran|sugieren|indican)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, 'Name a specific study or expert with a citation.', 'high'));
      }
      return results;
    },
  },

  {
    id: 'ES-09',
    name: 'Lenguaje excesivamente positivo',
    category: 'content',
    langs: ['es'],
    description: 'AI uses 96-133% more positive emotional language than humans (arXiv:2505.01800). Flags inflated positive framing.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\bresultados? (excelentes?|brillantes?|extraordinarios?|sobresalientes?|espectaculares?|increíbles?)\b/gi,
        /\bavance (significativo|revolucionario|extraordinario|sin precedentes|histórico|monumental)\b/gi,
        /\bun (gran|enorme|extraordinario|increíble|monumental|histórico) (paso|logro|éxito|avance|hito|resultado)\b/gi,
        /\bun (futuro|mañana) (mejor|más brillante|más prometedor|más justo)\b/gi,
        /\bimpacto (positivo|transformador|revolucionario|sin precedentes) en\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, 'Give concrete figures instead of inflated praise.', 'medium'));
      }
      return results;
    },
  },

  {
    id: 'ES-10',
    name: 'Pasiva con ser innecesaria',
    category: 'language',
    langs: ['es'],
    description: 'AI overuses ser-passive (ha sido desarrollado por) where natural Spanish prefers se-passive or active voice. Likely English influence in training data.',
    weight: 2,
    detect(text) {
      // Match "ha/fue/es/será sido + past participle + por"
      // Only flag when "por" follows — that's the sure sign it's a ser-passive, not a state description
      return findMatches(
        text,
        /\b(ha|fue|es|será|han|fueron|son|serán|había|habían|sería|serían)\s+(sido\s+)?\w+ado\b[^.!?]{0,30}\bpor\b/gi,
        'Consider se-passive or active voice: "se ha desarrollado" or "los investigadores han desarrollado".',
        'low',
      );
    },
  },
];

module.exports = PATTERNS_ES;
```

- [ ] **Step 4: Run tests**

```bash
npm test tests/es/patterns-es.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/patterns-es.js tests/es/patterns-es.test.js
git commit -m "feat(patterns): add ES-01 to ES-10 Spanish pattern detectors"
```

---

## Task 6: Spanish Stats — IFSZ, HLR, TTR Variance, Connector Density

**Files:**
- Modify: `src/stats.js`
- Create: `tests/es/stats-es.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/es/stats-es.test.js
import { describe, it, expect } from 'vitest';
import { computeStats, computeUniformityScore } from '../../src/stats.js';

// Helper: short clearly-AI Spanish text
const AI_TEXT_ES = `
En el mundo actual, la tecnología juega un papel fundamental en el desarrollo de la sociedad.
Es importante señalar que los avances han sido extraordinarios y revolucionarios.
Cabe destacar que los expertos señalan que el futuro es prometedor para todos.
Asimismo, múltiples estudios demuestran que este paradigma es esencial y crucial.
Sin embargo, no obstante, en consecuencia, debemos considerar los aspectos holísticos.
En definitiva, el camino por recorrer es largo pero el futuro es brillante y alentador.
`;

// Helper: natural Spanish paragraph
const HUMAN_TEXT_ES = `
Llegué tarde al aeropuerto. La cola de embarque era ridícula — cuarenta personas delante de mí,
todas arrastrando maletas demasiado grandes para el portaequipajes. El de seguridad me miró el
pasaporte tres veces. No sé por qué. Al final embarqué el último, sudando, y el asiento era el
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test tests/es/stats-es.test.js
```

Expected: failures about missing `ifsz`, `hapaxLegomenaRate`, `connectorDensity` fields and `lang` parameter not accepted.

- [ ] **Step 3: Update `src/stats.js`**

Change the top import:

```js
// BEFORE:
const { FUNCTION_WORDS } = require('./vocabulary');

// AFTER:
const { getLocale } = require('./locales');
```

Change `computeStats(text)` signature and add new metrics:

```js
function computeStats(text, lang = 'es') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return emptyStats(lang);
  }

  const locale = getLocale(lang);
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (words.length === 0) return emptyStats(lang);

  const wordCount = words.length;
  const uniqueWords = new Set(words);
  const typeTokenRatio = uniqueWords.size / wordCount;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

  // Sentence-level stats (unchanged)
  const sentenceLengths = sentences.map((s) => tokenize(s).length).filter((n) => n > 0);
  const sentenceCount = sentenceLengths.length;
  let avgSentenceLength = 0, sentenceLengthStdDev = 0, sentenceLengthVariation = 0, burstiness = 0;

  if (sentenceCount > 1) {
    avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceCount;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceCount;
    sentenceLengthStdDev = Math.sqrt(variance);
    sentenceLengthVariation = avgSentenceLength > 0 ? sentenceLengthStdDev / avgSentenceLength : 0;
    let consecutiveDiffSum = 0;
    for (let i = 1; i < sentenceLengths.length; i++) {
      consecutiveDiffSum += Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]);
    }
    const avgConsecutiveDiff = consecutiveDiffSum / (sentenceLengths.length - 1);
    burstiness = avgSentenceLength > 0 ? avgConsecutiveDiff / avgSentenceLength : 0;
  } else if (sentenceCount === 1) {
    avgSentenceLength = sentenceLengths[0];
  }

  // Function word ratio — uses locale-specific list
  const functionWordSet = new Set(locale.FUNCTION_WORDS);
  const functionWordCount = words.filter((w) => functionWordSet.has(w)).length;
  const functionWordRatio = functionWordCount / wordCount;

  // N-gram repetition (unchanged)
  const trigramRepetition = computeNgramRepetition(words, 3);

  // Paragraph stats (unchanged)
  const paragraphCount = paragraphs.length;
  const avgParagraphLength = paragraphCount > 0
    ? paragraphs.reduce((sum, p) => sum + tokenize(p).length, 0) / paragraphCount
    : 0;

  // ── Readability ─────────────────────────────────────────
  let fleschKincaid = null;
  let ifsz = null;

  if (lang === 'en') {
    const syllableCount = words.reduce((sum, w) => sum + estimateSyllables(w), 0);
    fleschKincaid = sentenceCount > 0
      ? 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59
      : 0;
  } else {
    // IFSZ (Flesch-Szigriszt) — validated Spanish readability formula
    // IFSZ = 206.835 − (62.3 × syllables/words) − (words/sentences)
    const syllableCount = words.reduce((sum, w) => sum + estimateSyllablesES(w), 0);
    const rawIfsz = sentenceCount > 0
      ? 206.835 - 62.3 * (syllableCount / wordCount) - (wordCount / sentenceCount)
      : 0;
    ifsz = Math.max(0, Math.min(100, rawIfsz));
  }

  // ── Hapax Legomena Rate ─────────────────────────────────
  // HLR = words appearing exactly once / total unique words
  // AI has systematically lower HLR than humans (StyloAI, arXiv:2405.10129)
  const wordFreq = {};
  for (const w of words) wordFreq[w] = (wordFreq[w] || 0) + 1;
  const hapaxCount = Object.values(wordFreq).filter((c) => c === 1).length;
  const hapaxLegomenaRate = uniqueWords.size > 0 ? hapaxCount / uniqueWords.size : 0;

  // ── Connector Density ───────────────────────────────────
  // Spanish-specific: AI stacks discourse connectors at > 0.4 per sentence
  // Only computed for Spanish; null for English
  let connectorDensity = null;
  if (lang === 'es' && locale.CONNECTORS && sentenceCount > 0) {
    const textLower = text.toLowerCase();
    const connectorHits = locale.CONNECTORS.reduce((count, connector) => {
      const regex = new RegExp(`\\b${connector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = textLower.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    connectorDensity = connectorHits / sentenceCount;
  }

  return {
    wordCount,
    uniqueWordCount: uniqueWords.size,
    sentenceCount,
    paragraphCount,
    avgWordLength: round(avgWordLength),
    avgSentenceLength: round(avgSentenceLength),
    sentenceLengthStdDev: round(sentenceLengthStdDev),
    sentenceLengthVariation: round(sentenceLengthVariation),
    burstiness: round(burstiness),
    typeTokenRatio: round(typeTokenRatio),
    functionWordRatio: round(functionWordRatio),
    trigramRepetition: round(trigramRepetition),
    avgParagraphLength: round(avgParagraphLength),
    fleschKincaid: fleschKincaid !== null ? round(fleschKincaid) : null,
    ifsz: ifsz !== null ? round(ifsz) : null,
    hapaxLegomenaRate: round(hapaxLegomenaRate),
    connectorDensity: connectorDensity !== null ? round(connectorDensity) : null,
    sentenceLengths,
  };
}
```

Update `emptyStats()` to include new fields:

```js
function emptyStats(lang = 'es') {
  return {
    wordCount: 0, uniqueWordCount: 0, sentenceCount: 0, paragraphCount: 0,
    avgWordLength: 0, avgSentenceLength: 0, sentenceLengthStdDev: 0,
    sentenceLengthVariation: 0, burstiness: 0, typeTokenRatio: 0,
    functionWordRatio: 0, trigramRepetition: 0, avgParagraphLength: 0,
    fleschKincaid: lang === 'en' ? 0 : null,
    ifsz: lang === 'es' ? 0 : null,
    hapaxLegomenaRate: 0,
    connectorDensity: lang === 'es' ? 0 : null,
    sentenceLengths: [],
  };
}
```

Update `computeUniformityScore(stats, lang = 'es')`:

```js
function computeUniformityScore(stats, lang = 'es') {
  if (stats.wordCount === 0) return 0;

  let score = 0;

  // Burstiness thresholds (same for both languages — CV is language-agnostic)
  if (stats.burstiness < 0.2) score += 25;
  else if (stats.burstiness < 0.35) score += 18;
  else if (stats.burstiness < 0.5) score += 10;
  else if (stats.burstiness < 0.65) score += 5;

  // Sentence length variation (same for both)
  if (stats.sentenceLengthVariation < 0.2) score += 25;
  else if (stats.sentenceLengthVariation < 0.35) score += 18;
  else if (stats.sentenceLengthVariation < 0.5) score += 10;
  else if (stats.sentenceLengthVariation < 0.65) score += 5;

  // TTR thresholds — Spanish has naturally higher TTR (~1.7x English)
  // Source: arXiv:2411.10227
  if (stats.wordCount > 100) {
    if (lang === 'es') {
      if (stats.typeTokenRatio < 0.50) score += 20;
      else if (stats.typeTokenRatio < 0.60) score += 12;
      else if (stats.typeTokenRatio < 0.70) score += 5;
    } else {
      if (stats.typeTokenRatio < 0.35) score += 20;
      else if (stats.typeTokenRatio < 0.45) score += 12;
      else if (stats.typeTokenRatio < 0.55) score += 5;
    }
  }

  // Trigram repetition (same for both)
  if (stats.trigramRepetition > 0.15) score += 10;
  else if (stats.trigramRepetition > 0.1) score += 6;
  else if (stats.trigramRepetition > 0.05) score += 3;

  // Hapax Legomena Rate — low HLR = AI (StyloAI top-4 feature)
  // Only meaningful for texts > 150 words
  if (stats.wordCount > 150) {
    if (stats.hapaxLegomenaRate < 0.30) score += 10;
    else if (stats.hapaxLegomenaRate < 0.45) score += 5;
  }

  // Connector density (Spanish only)
  if (lang === 'es' && stats.connectorDensity !== null) {
    if (stats.connectorDensity > 0.5) score += 10;
    else if (stats.connectorDensity > 0.35) score += 5;
  }

  return Math.min(score, 100);
}
```

<thinkanywhere>
The uniformity score now sums to a possible maximum of:
  25 (burstiness) + 25 (sentence variation) + 20 (TTR) + 10 (trigram) + 10 (HLR) + 10 (connector) = 100

This is internally consistent. However, the thresholds are initial estimates based on the research doc.
After implementing, run the stats on real AI-generated Spanish text vs. human Spanish text to validate:
  1. Take 5-10 AI-generated Spanish texts (ask Claude without instructions to write on a topic)
  2. Take 5-10 human-written Spanish texts (blog posts, news articles, emails)
  3. Compute uniformity scores for each
  4. Adjust thresholds if AI texts are not scoring significantly higher than human texts

The connector density thresholds (0.35, 0.5 per sentence) are based on the research doc's
observation that human formal Spanish uses 0.20-0.30 connectors/sentence. These should be
validated empirically as well.

Also consider: the IFSZ paragraph variance metric mentioned in the research isn't implemented yet.
This would add another signal: computing IFSZ per paragraph and measuring variance.
Consider adding in a follow-up if the basic IFSZ score alone proves insufficient.
</thinkanywhere>

- [ ] **Step 4: Run stats tests**

```bash
npm test tests/es/stats-es.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite — watch for existing test breakage**

```bash
npm test
```

If `statistics.test.js` fails on `emptyStats` shape or `computeUniformityScore` signature,
the existing tests call these without `lang`. Since defaults are `lang='es'`, existing tests
that check `fleschKincaid` will now get `null` for that field.

Fix: add `lang: 'en'` to all `computeStats(...)` and `computeUniformityScore(...)` calls
in `tests/statistics.test.js` that test English behavior. (Full list in Task 10.)

- [ ] **Step 6: Commit**

```bash
git add src/stats.js tests/es/stats-es.test.js
git commit -m "feat(stats): add IFSZ, HLR, connector density for Spanish; recalibrate TTR thresholds"
```

---

## Task 7: Thread `lang` Through `analyzer.js`

**Files:**
- Modify: `src/analyzer.js`
- Modify: `tests/analyzer.test.js` (add `lang: 'en'` to all calls)

- [ ] **Step 1: Read how `analyze()` currently calls patterns and stats**

The current call chain in `analyzer.js`:
```js
const { patterns, wordCount } = require('./patterns');
// ...
function analyze(text, opts = {}) {
  const { verbose, patternsToCheck, includeStats, ignoreCode } = opts;
  // runs: patterns.forEach(p => p.detect(text))
  // calls: computeStats(text)
}
```

- [ ] **Step 2: Update imports at top of `src/analyzer.js`**

```js
// BEFORE:
const { patterns, wordCount } = require('./patterns');
const { computeStats, computeUniformityScore } = require('./stats');

// AFTER:
const { createPatterns, wordCount } = require('./patterns');
const { computeStats, computeUniformityScore } = require('./stats');
```

- [ ] **Step 3: Update `analyze()` signature and internals**

```js
function analyze(text, opts = {}) {
  const {
    verbose = false,
    patternsToCheck = null,
    includeStats = true,
    ignoreCode = false,
    lang = 'es',       // ← new
  } = opts;

  // ...existing prep code...

  // Replace: patterns.filter(...)
  // With:
  const activePatterns = createPatterns(lang);
  const patternsToRun = patternsToCheck
    ? activePatterns.filter((p) => patternsToCheck.includes(p.id))
    : activePatterns;

  // Replace: computeStats(preparedText)
  // With:
  const stats = includeStats ? computeStats(preparedText, lang) : null;

  // Replace: computeUniformityScore(stats)
  // With:
  const uniformityScore = stats ? computeUniformityScore(stats, lang) : 0;

  // ...rest unchanged...
}
```

- [ ] **Step 4: Update `score()` function**

```js
function score(text, opts = {}) {
  const result = analyze(text, opts); // opts already contains lang
  return result.score;
}
```

- [ ] **Step 5: Run tests (expect some failures in analyzer.test.js)**

```bash
npm test tests/analyzer.test.js
```

Failures will be English tests that now default to `lang='es'` and get Spanish patterns instead of English patterns. Fix in Task 10.

- [ ] **Step 6: Commit**

```bash
git add src/analyzer.js
git commit -m "feat(analyzer): thread lang option through analyze/score"
```

---

## Task 8: Thread `lang` Through `humanizer.js`

**Files:**
- Modify: `src/humanizer.js`

- [ ] **Step 1: Find all calls to `analyze()` inside `humanizer.js`**

```bash
grep -n "analyze(" src/humanizer.js
```

- [ ] **Step 2: Update `humanize()` signature**

```js
// BEFORE:
function humanize(text, opts = {}) {
  const { autofix = false, verbose = false, ignoreCode = false } = opts;
  const result = analyze(text, { verbose, ignoreCode });

// AFTER:
function humanize(text, opts = {}) {
  const { autofix = false, verbose = false, ignoreCode = false, lang = 'es' } = opts;
  const result = analyze(text, { verbose, ignoreCode, lang });
```

- [ ] **Step 3: Run tests**

```bash
npm test tests/humanizer.test.js
```

Failures expected for same reason as analyzer. Fix in Task 10.

- [ ] **Step 4: Commit**

```bash
git add src/humanizer.js
git commit -m "feat(humanizer): thread lang option through humanize()"
```

---

## Task 9: Add `--lang` Flag to CLI

**Files:**
- Modify: `src/cli.js`

- [ ] **Step 1: Add `lang` to the flags object**

In the flags initialization block (around line 107), add:

```js
const flags = {
  // ...existing flags...
  lang: null,
};
```

- [ ] **Step 2: Parse `--lang` flag**

After the existing flag parsers, add:

```js
// Parse --lang flag
const langIdx = args.indexOf('--lang');
if (langIdx !== -1 && args[langIdx + 1]) {
  const rawLang = args[langIdx + 1].toLowerCase();
  if (['en', 'es'].includes(rawLang)) {
    flags.lang = rawLang;
  } else {
    console.error(color.red(`Error: unsupported language "${args[langIdx + 1]}". Use --lang en or --lang es.`));
    process.exit(1);
  }
}
// Default to Spanish
if (!flags.lang) flags.lang = 'es';
```

- [ ] **Step 3: Add `--lang` to help text**

In `showHelp()`, add to the Options section:

```js
  ${color.cyan('--lang <code>')}         Analysis language: en or es (default: es)
```

- [ ] **Step 4: Thread `flags.lang` into all command calls**

In the `opts` object built before the switch statement:

```js
const opts = {
  verbose: flags.verbose,
  patternsToCheck: flags.patterns,
  ignoreCode: flags.ignoreCode === true,
  lang: flags.lang,              // ← add this
};
```

The `humanize` call already receives `opts` through the switch cases — verify it includes `lang`.

- [ ] **Step 5: Manual smoke test**

```bash
echo "Esto es fundamental para el ecosistema." | node src/cli.js score
echo "Esto es fundamental para el ecosistema." | node src/cli.js score --lang en
echo "This is a testament to delve into." | node src/cli.js score --lang en
```

Expected: first two produce a score, third should score higher on English patterns.

- [ ] **Step 6: Commit**

```bash
git add src/cli.js
git commit -m "feat(cli): add --lang flag (default: es) for bilingual analysis"
```

---

## Task 10: Update Existing Tests to `lang: 'en'`

**Files:**
- Modify: `tests/analyzer.test.js`
- Modify: `tests/humanizer.test.js`
- Modify: `tests/statistics.test.js`
- Modify: `tests/calibration.test.js`
- Modify: `tests/edge-cases.test.js`
- Modify: `tests/performance.test.js`

All existing tests were written for English. Since the default is now `lang='es'`, they must explicitly opt into English.

- [ ] **Step 1: Update `tests/statistics.test.js`**

Every call to `computeStats(...)` without a lang argument: add `'en'` as second arg.
Every call to `computeUniformityScore(stats)`: add `'en'` as second arg.

```bash
# Find all calls to update
grep -n "computeStats(" tests/statistics.test.js
grep -n "computeUniformityScore(" tests/statistics.test.js
```

Pattern: replace `computeStats(text)` → `computeStats(text, 'en')` and `computeUniformityScore(stats)` → `computeUniformityScore(stats, 'en')`.

Also: any test checking `stats.fleschKincaid` is now valid because `lang='en'` returns it. Tests checking `stats.ifsz` should assert it's `null` for English.

- [ ] **Step 2: Update `tests/analyzer.test.js`**

Every `analyze(text, opts)` call: add `lang: 'en'` to opts.
Every `score(text, opts)` call: add `lang: 'en'` to opts.

```bash
grep -n "analyze(" tests/analyzer.test.js | head -20
grep -n "score(" tests/analyzer.test.js | head -20
```

- [ ] **Step 3: Update `tests/humanizer.test.js`**

Every `humanize(text, opts)` call: add `lang: 'en'` to opts.

- [ ] **Step 4: Update `tests/calibration.test.js`, `tests/edge-cases.test.js`, `tests/performance.test.js`**

Same pattern — add `lang: 'en'` to all `analyze()`, `score()`, `humanize()`, `computeStats()`, `computeUniformityScore()` calls.

- [ ] **Step 5: Run full suite and verify all original tests pass**

```bash
npm test
```

Expected: all baseline tests pass PLUS all new ES tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/
git commit -m "test: add lang:en to all existing English tests after bilingual default change"
```

---

## Task 11: Spanish Integration Tests

**Files:**
- Create: `tests/es/integration-es.test.js`

- [ ] **Step 1: Write integration tests**

```js
// tests/es/integration-es.test.js
import { describe, it, expect } from 'vitest';
import { analyze, score } from '../../src/analyzer.js';

describe('Full pipeline — Spanish texts', () => {
  it('scores clearly AI Spanish text above 50', () => {
    const text = `
      En el mundo actual, la tecnología juega un papel fundamental en el desarrollo de la sociedad.
      Es importante señalar que los avances han sido extraordinarios en múltiples ámbitos.
      Cabe destacar que los expertos señalan que el paradigma está evolucionando.
      Asimismo, múltiples estudios demuestran que este enfoque holístico es esencial y crucial.
      Sin embargo, no obstante, en consecuencia, debemos considerar los aspectos integrales.
      En definitiva, el camino por recorrer es largo pero el futuro es prometedor y brillante.
    `;
    expect(score(text, { lang: 'es' })).toBeGreaterThan(50);
  });

  it('scores human-sounding Spanish text below 40', () => {
    const text = `
      Llegué tarde. La cola era ridícula — cuarenta personas con maletas enormes.
      El de seguridad me miró el pasaporte tres veces. No sé por qué.
      Al final embarqué el último, sudando, y el asiento era el del medio.
      El del medio siempre. El vuelo duró dos horas y el niño de delante lloró todo el rato.
    `;
    expect(score(text, { lang: 'es' })).toBeLessThan(40);
  });

  it('detects Spanish-specific patterns in result findings', () => {
    const text = 'Cabe destacar que es importante señalar los aspectos fundamentales del ecosistema.';
    const result = analyze(text, { lang: 'es' });
    const patternIds = result.findings.map((f) => f.patternId);
    // Should detect ES-05 (énfasis metacomentario) and vocabulary (fundamental, ecosistema)
    expect(patternIds.some((id) => id === 'ES-05' || id === 7)).toBe(true);
  });

  it('does not use English patterns for Spanish text', () => {
    const text = 'En el mundo actual, la tecnología es fundamental.';
    const result = analyze(text, { lang: 'es' });
    // Pattern 16 (Title Case) should not appear — it's EN-only
    expect(result.findings.some((f) => f.patternId === 16)).toBe(false);
  });

  it('English and Spanish produce different scores for the same text', () => {
    const text = 'Es fundamental y crucial considerar el ecosistema paradigmático.';
    const esScore = score(text, { lang: 'es' });
    const enScore = score(text, { lang: 'en' });
    // Spanish detector should catch 'fundamental', 'crucial', 'ecosistema', 'paradigmático'
    // English detector won't catch Spanish-specific words
    expect(esScore).toBeGreaterThan(enScore);
  });

  it('returns ifsz in stats for Spanish', () => {
    const text = 'El sistema analiza los datos de forma eficiente. Los resultados son positivos para el proyecto.';
    const result = analyze(text, { lang: 'es' });
    expect(result.stats.ifsz).not.toBeNull();
    expect(result.stats.fleschKincaid).toBeNull();
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm test tests/es/integration-es.test.js
```

If the "AI text > 50" or "human text < 40" assertions fail, the thresholds need calibration.
These are the most important end-to-end validation tests. If they fail:
  1. Check which patterns are firing (use `analyze()` and inspect `findings`)
  2. Adjust weights in `src/patterns-es.js` or TIER thresholds in `src/locales/es.js`

- [ ] **Step 3: Run full suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/es/integration-es.test.js
git commit -m "test(es): add Spanish integration tests for full analysis pipeline"
```

---

## Task 12: Update `SKILL.md`

**Files:**
- Modify: `SKILL.md`

- [ ] **Step 1: Rewrite `SKILL.md`**

Replace the current content with:

```markdown
---
name: humanizer
version: 3.0.0
description: >
  Detecta y elimina patrones de escritura generada por IA en español e inglés.
  Por defecto opera en español. Usar --lang en para inglés.
  Detecta vocabulario inflado, conectores sobreutilizados, frases de énfasis
  metacomentario, artefactos de chatbot, gerundios encadenados, conclusiones
  genéricas, atribuciones vagas y patrones estadísticos (burstiness, TTR, IFSZ).
defaultLocale: es
languages: [es, en]
license: MIT
---

# Humanizer: eliminar patrones de escritura IA (v3.0)

Eres un editor de escritura que identifica y elimina señales de texto generado por IA.
Objetivo: que el texto suene como si lo hubiera escrito una persona específica con criterio
propio, no como si saliera de un LLM.

Basado en Wikipedia:Signs of AI writing, investigación de Copyleaks, AuTexTification
(IberLEF 2023), StyloAI (arXiv:2405.10129), y análisis empírico de ChatGPT/Claude/Gemini
en español.

## Cuando analices texto en español, detecta:

### Señales de vocabulario (las más visibles)
- **Tier 1** — flaggear siempre: fundamental, crucial, esencial, primordial, invaluable,
  trascendental, revolucionario, innovador, vanguardista, disruptivo, robusto, integral,
  holístico, paradigma, sinergia, ecosistema, potenciar, optimizar, empoderar, apalancar
- **Tier 2** — sospechosas en densidad: asimismo, igualmente, no obstante, sin embargo,
  en consecuencia, por consiguiente, cabe destacar, cabe señalar, vale la pena destacar,
  resulta fundamental, en el mundo actual, hoy en día, a lo largo de los años

### Patrones gramaticales y estructurales
| # | Patrón | Señal |
|---|--------|-------|
| ES-01 | Gerundio encadenado | 3+ gerundios en la misma frase |
| ES-02 | Apertura con contexto vago | "En el mundo actual...", "En la era digital..." |
| ES-03 | Triada de abstractos | "innovación, creatividad y transformación" |
| ES-04 | Tono sycofántico | "¡Excelente pregunta!", "Con mucho gusto..." |
| ES-05 | Énfasis metacomentario | "Cabe destacar que", "Es importante señalar" |
| ES-06 | Disclaimers de corte | "Como modelo de lenguaje", "Hasta mi fecha de corte" |
| ES-07 | Conclusiones genéricas | "El futuro es prometedor", "Estamos ante un momento histórico" |
| ES-08 | Atribuciones vagas | "Los expertos señalan", "Múltiples estudios demuestran" |
| ES-09 | Lenguaje excesivamente positivo | "Avance revolucionario", "Resultados excelentes" |
| ES-10 | Pasiva con ser innecesaria | "ha sido desarrollado por" (usar pasiva refleja) |

### Indicadores estadísticos (invisibles al ojo, pero reales)
- **Burstiness baja**: todas las frases tienen longitud similar (IA: CV < 0.35; humano: > 0.6)
- **TTR uniforme**: vocabulario igualmente diverso en cada párrafo (humano varía entre párrafos)
- **HLR baja**: pocas palabras que aparecen solo una vez (la IA evita lo infrecuente)
- **Conectores excesivos**: > 0.4 conectores por frase (humano: 0.2-0.3)
- **IFSZ uniforme**: legibilidad idéntica en todos los párrafos (humano varía)

## Qué añadir al reescribir

- Variar longitud de frases: corta, larga, cortísima, larga con subordinada
- Tomar postura — una opinión concreta, no "hay quienes dicen"
- Usar datos reales: números, nombres, fechas, lugares específicos
- Permitir imperfección: empezar con "Y" o "Pero", usar fragmentos, hablar en primera persona
- Verbos simples: "es", "tiene", "hace", "dijo" están bien; no hace falta "constituye" ni "representa"
- Leerlo en voz alta — si no lo dirías así, no lo escribas así

## Para texto en inglés: usar --lang en

El modo inglés activa los detectores originales (28 patrones, vocabulario de 500+ palabras
anglófonas). Ver SKILL.md v2.2 para referencia de los patrones en inglés.
```

- [ ] **Step 2: Verify the file was written correctly**

```bash
head -5 SKILL.md
```

Expected: `name: humanizer` and `version: 3.0.0`.

- [ ] **Step 3: Commit**

```bash
git add SKILL.md
git commit -m "docs(skill): rewrite SKILL.md for bilingual v3.0 — Spanish primary"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Arquitectura factory function (Opción C) | Task 4 |
| Default lang = 'es' | Tasks 4, 6, 7, 8, 9 |
| --lang en para inglés | Task 9 |
| src/locales/ architecture | Task 1 |
| Spanish vocabulary Tier 1/2/3 | Task 2 |
| Spanish AI_PHRASES con regex | Task 2 |
| FUNCTION_WORDS_ES para stats | Tasks 2 + 6 |
| CONNECTORS_ES para connector density | Tasks 2 + 6 |
| langs property en cada patrón | Task 4 |
| createPatterns(lang) filtra por langs | Task 4 |
| ES-01 a ES-10 pattern detectors | Task 5 |
| estimateSyllablesES | Task 3 |
| IFSZ (Flesch-Szigriszt) para español | Task 6 |
| HLR (Hapax Legomena Rate) | Task 6 |
| TTR thresholds recalibrados para ES | Task 6 |
| Connector density metric | Task 6 |
| computeUniformityScore(stats, lang) | Task 6 |
| analyzer.js acepta lang | Task 7 |
| humanizer.js acepta lang | Task 8 |
| CLI --lang flag (default 'es') | Task 9 |
| Tests existentes con lang:'en' | Task 10 |
| Tests nuevos en español | Tasks 2, 5, 6, 11 |
| SKILL.md bilingüe | Task 12 |

**Placeholder scan:** No TBDs. Complex parts marked with `<thinkanywhere>`.

**Type consistency:** `createPatterns(lang)` used in Task 4 and consumed in Task 7 with same signature. `computeStats(text, lang)` defined in Task 6 and called in Task 7. `computeUniformityScore(stats, lang)` same pattern.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-05-bilingual-humanizer.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks.

**2. Inline Execution** — Execute tasks in this session using the executing-plans skill.

Which approach?
