# Spanish Detection Expansion — Design Spec

**Goal:** Expand Spanish AI detection from 10 to 20 patterns, overhaul vocabulary tiers, and improve all 10 existing patterns to achieve detection parity with the English set.

**Detection philosophy:** Prefer false positives over false negatives — when in doubt, flag as AI.

**Architecture:** All changes are isolated to `src/locales/es.js` and `src/core/patterns/es.js`. No changes to EN patterns, stats, analyzer, or CLI.

---

## Section 1: Vocabulary expansion (`src/locales/es.js`)

### TIER_1 additions (dead giveaways — always flagged)

**Confirmed by user:**
`abordar`, `examinar`, `gratificante`, `fascinante`, `motivador`, `estimulante`, `revelador`, `multidisciplinar`, `transversal`, `interdisciplinar`

**Analytical performance verbs** (AI announces the analysis instead of doing it):
`adentrarse`, `ahondar`, `dilucidar`, `desglosar`, `desgranar`, `profundizar`, `explorar`, `comprender`, `identificar`

**Positive emotional adjectives** (AI uses 96%+ more than humans):
`enriquecedor`, `apasionante`, `esclarecedor`, `prometedor`, `valioso`

**Corporate/management vocabulary:**
`alineado`, `vertebrar`, `pivotar`, `iterar`, `resiliencia`, `resiliente`, `agilidad`, `ownership`

**Promoted from TIER_3** (strong enough signal to be dead giveaways):
`significativo`, `extraordinario`

### TIER_3 expansion (context-dependent — flagged at >3% density)

Expand from 27 to ~60 words. Add:
`abundante`, `amplio`, `apropiado`, `beneficioso`, `central`, `clave`, `coherente`, `complejo`, `concreto`, `consistente`, `continuo`, `diverso`, `específico`, `flexible`, `frecuente`, `global`, `importante`, `integral`, `moderno`, `necesario`, `nuevo`, `objetivo`, `óptimo`, `particular`, `positivo`, `potencial`, `preciso`, `principal`, `progresivo`, `real`, `reciente`, `típico`, `variado`, `viable`

### AI_PHRASES additions

Framing phrases not yet covered:
- `"en el marco de"`, `"en el ámbito de"`, `"desde esta perspectiva"`
- `"en aras de"`, `"con miras a"`, `"de cara a"`, `"a nivel de"`
- `"a modo de ejemplo"`, `"a título de ejemplo"`
- `"llevar a cabo"`, `"poner en marcha"`, `"dar respuesta a"`
- `"hacer frente a"`

---

## Section 2: Improvements to existing ES-01 — ES-10

### ES-01 — Gerundio encadenado
- **Change:** Lower threshold from **3** gerunds to **2** gerunds in same sentence.
- **Rationale:** Two chained gerunds in Spanish is already a strong AI signal. Humans rarely chain more than one.
- **Example now detected:** `"El equipo fue avanzando y mejorando sus resultados."` ✓

### ES-02 — Apertura con contexto vago
- **Change:** Expand regex to catch more vague openers not currently covered:
  - `"Vivimos en un momento en que..."`
  - `"Nos encontramos en un momento..."`
  - `"Nos encontramos ante un..."`
  - `"En los últimos años, ..."` (at paragraph start)
  - `"A lo largo de los últimos años..."` (at paragraph start)
  - `"Hoy en día, más que nunca..."`
  - `"En pleno siglo XXI..."`

### ES-03 — Tríada de abstractos
- **Change:** Expand abstract nouns list from ~20 to ~50 words.
- **Add:** `liderazgo`, `talento`, `diversidad`, `inclusión`, `bienestar`, `propósito`, `agilidad`, `resiliencia`, `colaboración`, `confianza`, `empoderamiento`, `autenticidad`, `pasión`, `vocación`, `flexibilidad`, `adaptabilidad`, `proactividad`, `cohesión`, `rendimiento`

### ES-04 — Tono sycofántico
- **Change:** Add chatbot closing sycophancy patterns (currently only covers openers):
  - `"espero haber sido de ayuda"`
  - `"espero que esta información te resulte útil"`
  - `"ha sido un placer ayudarte"`
  - `"no dudes en volver a preguntar"`

### ES-07 — Conclusiones genéricas
- **Change:** Add more generic closing patterns:
  - `"en definitiva, queda claro que"`
  - `"todo apunta a que"`
  - `"sin duda alguna, ..."`
  - `"en este contexto, resulta evidente que"`
  - `"es hora de actuar"`
  - `"es momento de reflexionar"`
  - `"el reto está en nuestras manos"`
  - `"marca un antes y un después"`

### ES-08 — Atribuciones vagas
- **Change:** Add variants currently missed:
  - `"los datos (revelan|apuntan|confirman|evidencian)"`
  - `"la mayoría de (los expertos|los especialistas|los estudios)"`
  - `"se sabe que"`, `"se ha demostrado que"`, `"está comprobado que"`
  - `"fuentes (especializadas|autorizadas|consultadas) indican"`

### ES-09 — Lenguaje excesivamente positivo
- **Change:** Expand patterns:
  - `"experiencia (única|enriquecedora|transformadora|inolvidable)"`
  - `"oportunidad (única|excepcional|irrepetible|histórica)"`
  - `"(cambiar|transformar) para siempre"`
  - `"marca un antes y un después"`
  - `"hito (histórico|sin precedentes|fundamental)"`
  - `"(nunca|jamás) ha habido nada igual"`

### ES-10 — Pasiva con ser innecesaria
- **Change:** Expand regex to also capture:
  - `"debe ser + participio"`
  - `"puede ser + participio"`
  - `"tiene que ser + participio"`
  - `"debería ser + participio"`

### ES-05, ES-06 — No changes (already comprehensive)

---

## Section 3: New patterns ES-11 — ES-20

### ES-11 — Framing de análisis
- **Category:** `filler`
- **Weight:** 4
- **Signal:** AI announces what it is about to do instead of doing it.
- **Detects:**
  - `"en este artículo (vamos a|exploraremos|analizaremos|abordaremos)"`
  - `"procedemos a (analizar|explorar|examinar|ver)"`
  - `"comencemos por (entender|analizar|explorar|ver)"`
  - `"a continuación (vamos a|exploraremos|analizaremos|veremos)"`
  - `"antes de (responder|continuar), es importante (analizar|entender|explorar)"`
  - `"permíteme (explicarte|presentarte|mostrarte|ayudarte)"` (already in AI_PHRASES, add to pattern)
- **Suggestion:** Start with the content directly.

### ES-12 — Copula avoidance española
- **Category:** `language`
- **Weight:** 3
- **Signal:** Avoiding "es/son" by substituting with verbose copula equivalents. Borrowed from English AI training data.
- **Detects:**
  - `"sirve como"` / `"sirven como"`
  - `"actúa como"` / `"actúan como"`
  - `"funciona como"` / `"funcionan como"`
  - `"se erige como"`
  - `"se posiciona como"`
  - `"desempeña (el|un) papel (de|fundamental|clave|crucial)"`
  - `"se presenta como"`
- **Suggestion:** Use "es/son" directly.

### ES-13 — Pregunta retórica de apertura
- **Category:** `content`
- **Weight:** 4
- **Signal:** AI hooks with a rhetorical question at the start of a paragraph or text.
- **Detects** (only at start of line/paragraph):
  - `"¿Alguna vez te has preguntado"`
  - `"¿Sabías que"`
  - `"¿Te has dado cuenta de"`
  - `"¿Qué pasaría si"`
  - `"¿Cómo (es posible|puede ser|explicar) que"`
  - `"¿Por qué (es importante|debería importarnos|merece la pena)"`
- **Suggestion:** Start with the answer, not the question.

### ES-14 — Hedging excesivo
- **Category:** `filler`
- **Weight:** 3
- **Signal:** Multiple hedges that weaken the statement without adding information.
- **Detects:**
  - `"podría (decirse|considerarse|afirmarse|argumentarse) que"`
  - `"en cierta (medida|forma|manera)"`
  - `"hasta cierto punto"`
  - `"de alguna (manera|forma|modo)"`
  - `"en algún sentido"`
  - `"de cierta forma"`
  - `"en mayor o menor medida"`
- **Suggestion:** Say it directly or don't say it.

### ES-15 — Paralelismo negativo
- **Category:** `language`
- **Weight:** 3
- **Signal:** Formulaic "not only X but also Y" construct overused by AI in Spanish.
- **Detects:**
  - `"no solo .{3,60} sino (también|que además)"`
  - `"no únicamente .{3,60} sino (también|que)"`
  - `"no meramente .{3,60} sino"`
  - `"no simplemente .{3,60} sino"`
- **Suggestion:** Choose one concept and develop it directly.

### ES-16 — Desafíos formulaicos
- **Category:** `content`
- **Weight:** 3
- **Signal:** AI acknowledges challenges in a formulaic way before pivoting to optimism. Spanish equivalent of EN-6.
- **Detects:**
  - `"a pesar de (los|estos|dichos) (retos|desafíos|obstáculos|dificultades)"`
  - `"si bien (existen|hay|persisten) (retos|desafíos|obstáculos)"`
  - `"aunque (el camino|el proceso|la tarea) no (es|será|resulta) (sencillo|fácil|simple)"`
  - `"los (retos|desafíos|obstáculos) (son|existen|persisten)[^.]{0,40}(pero|sin embargo|no obstante)"`
- **Suggestion:** Name the specific challenge or drop the framing.

### ES-17 — Estructura excesiva
- **Category:** `style`
- **Weight:** 2
- **Signal:** AI over-structures content with bold inline headers in bullet lists.
- **Detects:**
  - Lines matching `^\s*[-*•]\s+\*\*[^*]{2,40}[:]\*\*` (bullet + bold header + colon)
  - 5+ bullet points in a row
- **Suggestion:** Use prose paragraphs; reserve bullets for genuinely list-like content.

### ES-18 — Apertura de artículo formulaica
- **Category:** `filler`
- **Weight:** 4
- **Signal:** AI announces the article structure before writing it. Almost never appears in human writing.
- **Detects:**
  - `"en este artículo (vamos a|te|exploraremos|analizaremos|abordaremos|trataremos)"`
  - `"a lo largo de este (artículo|texto|post|documento|ensayo)"`
  - `"en las (siguientes|próximas) (líneas|páginas|secciones|palabras)"`
  - `"este (artículo|texto|post) (tiene como objetivo|busca|pretende|se propone)"`
- **Suggestion:** Start with the content directly.

### ES-19 — Cierre de chatbot español
- **Category:** `communication`
- **Weight:** 4
- **Signal:** Closing phrases that expose chatbot origin. Almost never appear in human writing.
- **Detects:**
  - `"espero que (esto|esta información|esta respuesta) te haya (sido útil|ayudado)"`
  - `"espero haber (sido de ayuda|respondido tu pregunta|aclarado)"`
  - `"no dudes en (preguntar|consultarme|escribirme|contactarme)"`
  - `"si (tienes|tiene) (alguna )?(otra )?(pregunta|duda|consulta)"`
  - `"¿hay algo más en lo que (pueda|te pueda) ayudar"`
  - `"quedo a tu (disposición|entera disposición)"`
  - `"ha sido un placer (ayudarte|atenderte|responderte)"`
- **Suggestion:** Remove — end with the actual content.

### ES-20 — Clickbait de guía
- **Category:** `content`
- **Weight:** 2
- **Signal:** AI-generated article titles and section openers with clickbait formula patterns.
- **Detects:**
  - `"todo lo que (necesitas|debes) saber (sobre|acerca de)"`
  - `"guía (completa|definitiva|esencial|práctica) (de|para|sobre)"`
  - `"\d+ (cosas|razones|claves|aspectos|formas|maneras|pasos|consejos|secretos) (que|para|de|sobre)"`
  - `"lo que (nadie te cuenta|no te dicen) (sobre|acerca de)"`
  - `"(todo|lo) que necesitas saber"`
- **Suggestion:** Write a specific, descriptive title instead.

---

## File structure

| File | Changes |
|------|---------|
| `src/locales/es.js` | Expand TIER_1 (+~30 words), TIER_3 (+~33 words), AI_PHRASES (+14 phrases) |
| `src/core/patterns/es.js` | Improve ES-01–ES-10 (8 patterns), add ES-11–ES-20 (10 new patterns) |
| `tests/core/patterns/es/patterns-es.test.js` | New tests for ES-11–ES-20, update tests for improved patterns |
| `tests/core/patterns/es/vocabulary-es.test.js` | Tests for new TIER_1/TIER_3 words |

## What does NOT change

- `src/core/patterns/en.js` — no changes to EN patterns
- `src/core/stats.js` — no changes to statistical metrics
- `src/core/analyzer.js` — no changes to scoring engine
- `src/cli/` — no CLI changes
- `src/locales/en.js` — no changes

## Testing strategy

Every new pattern needs:
1. A **positive test** — text that should be detected
2. A **negative test** — natural Spanish text that should NOT be flagged
3. Edge cases for boundary conditions (e.g., ES-01: exactly 1 gerund = no flag, 2 = flag)

Existing pattern tests updated where threshold or regex changes.
