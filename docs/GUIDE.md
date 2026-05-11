# Humanizer — Guía completa de uso

Humanizer detecta y elimina patrones de escritura generada por IA. Analiza texto con **49 detectores de patrones** (EN) + **20 detectores de patrones** (ES), **500+ términos de vocabulario** en tres niveles, y **análisis estadístico** (burstiness, type-token ratio, legibilidad).

---

## Índice

1. [Instalación](#instalación)
2. [Quickstart](#quickstart)
3. [Comandos](#comandos)
   - [score](#score)
   - [analyze](#analyze)
   - [humanize](#humanize)
   - [suggest](#suggest)
   - [report](#report)
   - [stats](#stats)
   - [scan](#scan)
   - [compare](#compare)
4. [Opciones globales](#opciones-globales)
5. [Idiomas](#idiomas)
6. [Archivo de configuración](#archivo-de-configuración)
7. [Uso en CI/CD](#uso-en-cicd)
8. [API programática](#api-programática)
9. [Referencia de patrones](#referencia-de-patrones)
10. [Métricas estadísticas](#métricas-estadísticas)
11. [Cómo interprétar el score](#cómo-interpretar-el-score)
12. [Códigos de salida](#códigos-de-salida)
13. [Recetas y casos de uso](#recetas-y-casos-de-uso)

→ Para instalación, ver [README.md](../README.md#instalación).

El idioma por defecto es **español**. Para inglés: `--lang en`.

---

## Comandos

### score

Puntuación rápida (0–100). Cuanto más alto, más texto parece generado por IA.

```bash
echo "Texto aquí" | humanizer score
humanizer score -f borrador.md
humanizer score -f artículo.txt --lang en
```

**Output:**

```
🟡 42/100
```

**Output JSON:**

```bash
humanizer score -f borrador.md --json
# → {"score": 42}
```

Los emojis de badge corresponden a:

| Badge | Rango  | Nivel                    |
| ----- | ------ | ------------------------ |
| 🟢    | 0–19   | Mostly human-sounding    |
| 🟡    | 20–44  | Lightly AI-touched       |
| 🟠    | 45–69  | Moderately AI-influenced |
| 🔴    | 70–100 | Heavily AI-generated     |

---

### analyze

Análisis completo: score, patrones detectados, estadísticas y fiabilidad.

```bash
humanizer analyze -f borrador.md
echo "Tu texto" | humanizer analyze
humanizer analyze -f tech-doc.md --ignore-code   # ignora bloques de código
humanizer analyze -f artículo.txt --verbose       # muestra todos los matches
humanizer analyze -f post.md --patterns 7,19,22   # sólo patrones específicos
humanizer analyze -f doc.md --threshold 3         # sólo patrones con peso ≥ 3
```

**Output (terminal):**

```
════════════════════════════════════════════════════
  🟡 42/100  Lightly AI-touched
  Reliability: ◐ medium (word count below recommended)

  Este texto lightly AI-touched. Se encontraron 7 coincidencias en
  3 tipos de patrones en 312 palabras.
════════════════════════════════════════════════════

  ── Estadísticas ─────────────────────────────────
  Sentencias: 18  |  Párrafos: 4  |  Palabras: 312
  Burstiness: 0.38 (algo uniforme)
  TTR: 0.52 (vocabulario aceptable)
  IFSZ: 64 (legibilidad media)

  ── Findings ─────────────────────────────────────
  [ES-07] Conclusiones genéricas  (weight: 3)  ×2
    → L4: "En conclusión, es importante destacar..."
      Sugerencia: Termina con algo específico al texto.
  ...
```

**Output JSON:**

```bash
humanizer analyze -f borrador.md --json | jq '.score, .reliability.level'
```

---

### humanize

Sugerencias accionables para humanizar el texto, organizadas por prioridad. Opcionalmente aplica correcciones automáticas.

```bash
humanizer humanize -f borrador.md
humanizer humanize --autofix -f borrador.md         # aplica auto-fixes
humanizer humanize --autofix -f borrador.md > fix.txt  # guarda texto corregido
echo "Texto" | humanizer humanize --lang en
```

**Output sin `--autofix`:**

```
══ HUMANIZATION SUGGESTIONS ══════════════════════

  ● Critical (weight ≥ 4)
  ─────────────────────────────────────────────────
  [ES-02] Apertura con contexto vago  (L1)
    "En el contexto actual de la transformación digital..."
    → Empieza con algo concreto: un dato, un hecho, una acción.

  ● Important (weight 2–3)
  ─────────────────────────────────────────────────
  [ES-07] Conclusiones genéricas  (L12)
    "En conclusión, es fundamental..."
    → Sé específico: ¿qué conclusión exactamente?

  ── Guidance ──────────────────────────────────────
  • Avoid filler openings. Start with a concrete fact or action.
  • Use specific examples instead of abstract claims.

  ── Style tips ────────────────────────────────────
  • Burstiness 0.31 — vary sentence length more. Mix short punchy
    sentences with longer ones.
```

**Output con `--autofix`:**

El texto corregido se escribe a stdout. Las correcciones automáticas incluyen:

- Eliminar frases relleno ("in order to" → "to", "due to the fact that" → "because")
- Eliminar artefactos de chatbot (aperturas y cierres genéricos)
- Normalizar unicode oculto (zero-width spaces, soft hyphens)
- Corregir comillas tipográficas

**Output JSON:**

```bash
humanizer humanize -f borrador.md --json | jq '{
  score: .score,
  critical: (.critical | length),
  important: (.important | length),
  autofix_applied: (.autofix.fixes | length)
}'
```

---

### suggest

Como `humanize` pero muestra sólo las sugerencias, sin análisis estadístico.

```bash
humanizer suggest -f borrador.md
humanizer suggest -f artículo.md --lang en
```

Útil cuando sólo quieres la lista de cambios a hacer.

---

### report

Genera un informe Markdown completo: ideal para guardar como artefacto o enviar.

```bash
humanizer report -f artículo.md > informe.md
humanizer report -f doc.txt --lang en > report-en.md
```

El Markdown incluye: score, badge, tabla de categorías, findings por patrón con citas del texto, estadísticas y tabla comparativa.

---

### stats

Sólo las métricas estadísticas del texto, sin analizar patrones.

```bash
humanizer stats -f borrador.md
humanizer stats -f ensayo.txt --lang en
```

**Output:**

```
── ESTADÍSTICAS ───────────────────────────────────────

  ── Ritmo ──────────────────────────────────────────
    Sentencias:       18
    Longitud media:   22.4 palabras/sentencia
    Desv. estándar:   8.1
    Coef. variación:  0.36  (moderado)
    Burstiness:       0.41  (algo uniforme)

  ── Vocabulario ────────────────────────────────────
    Total palabras:   312
    Palabras únicas:  187
    Type-token ratio: 0.60  (diverso)
    Long. media pal:  5.8 caracteres

  ── Estructura ─────────────────────────────────────
    Párrafos:         4
    Long. media pár:  78 palabras
    Repetición 3-grams: 0.04

  ── Legibilidad ────────────────────────────────────
    IFSZ: 62
```

---

### scan

Escanea todos los archivos de un directorio (o un archivo concreto), los ordena por score y detecta patrones recurrentes entre archivos.

```bash
# Escaneo básico (directorio específico)
humanizer scan docs

# Con extensiones específicas
humanizer scan docs --ext md,txt,rst

# Ignorar archivos cortos
humanizer scan docs --min-words 50

# Fallar si algún archivo supera score 50
humanizer scan docs --fail-above 50

# Con directorio ignorado adicional
humanizer scan docs --ext md --ignore-dirs generated,vendor,node_modules

# Ignorar bloques de código en docs técnicos
humanizer scan docs --ext md --ignore-code

# Guardar baseline para comparar luego
humanizer scan docs --json > .humanizer-baseline.json
```

> **Nota de seguridad:** Evita escanear directorios amplios con `--no-default-ignore`. Usa siempre que sea posible `ignore-dirs` para excluir contenido privado o irrelevante (`node_modules`, `.git`, `vendor`, `generated`, etc.).

**Output:**

```
── REPO SCAN ─────────────────────────────────────────

  Target: docs
  Files scanned: 23  |  Skipped: 2
  Avg score: 38  |  Max: 67  |  Min: 4

  Top flagged files:
   67/100 [FAIL] docs/intro.md (14 matches, 420 words)
   52/100 [FAIL] docs/guide.md (9 matches, 312 words)
   41/100  [OK]  docs/api.md (6 matches, 890 words)
   ...

  Common pattern hotspots:
  [ES-07] Conclusiones genéricas (18 matches across 7 files)
  [ES-02] Apertura con contexto vago (12 matches across 5 files)
  [ES-05] Énfasis metacomentario (9 matches across 4 files)
```

**Salida JSON completa (para baseline):**

```bash
humanizer scan docs --json > .humanizer-baseline.json
```

---

#### Escaneo con baseline (detección de regresiones)

```bash
# 1. Guardar estado actual
humanizer scan docs --json > .humanizer-baseline.json

# 2. Editar docs...

# 3. Comparar contra baseline
humanizer scan docs --baseline .humanizer-baseline.json

# 4. Fallar si algún archivo empeoró
humanizer scan docs --baseline .humanizer-baseline.json --fail-on-regression

# 5. Sólo flagear regresiones de 5+ puntos
humanizer scan docs --baseline .humanizer-baseline.json \
  --fail-on-regression --regression-threshold 5
```

**Output con baseline:**

```
── REPO SCAN ─────────────────────────────────────────
  ...

  Baseline comparison:
  Compared: 23  |  Regressions: 2  |  Improvements: 5  |  Unchanged: 16

  Baseline regressions:
  +8  docs/intro.md (34 → 42)
  +3  docs/api.md (20 → 23)

  Baseline improvements:
  -12  docs/guide.md (67 → 55)
  -6   docs/setup.md (48 → 42)
```

---

### compare

Compara dos versiones de un texto y muestra exactamente qué patrones mejoraron o empeoraron.

```bash
humanizer compare --before borrador-v1.md --after borrador-v2.md
humanizer compare --before v1.txt --after v2.txt --lang en
humanizer compare --before v1.md --after v2.md --json
```

**Output:**

```
── DRAFT COMPARISON ──────────────────────────────────

  Before: 54/100  (12 matches, 380 words)
  After:  31/100  (5 matches, 395 words)
  Delta:  ↓ -23 points

  Top improvements:
  • Conclusiones genéricas: 3 → 0 (-3)
  • Énfasis metacomentario: 4 → 1 (-3)
  • Apertura con contexto vago: 2 → 0 (-2)

  New regressions:
  • Filler phrases: 0 → 2 (+2)
```

---

## Opciones globales

Estas opciones funcionan con todos los comandos:

| Opción              | Descripción                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `-f, --file <ruta>` | Leer texto de archivo en vez de stdin                                   |
| `--json`            | Salida en JSON (sin colores ni formato)                                 |
| `--lang <en\|es>`   | Idioma del análisis. Default: `es`                                      |
| `--ignore-code`     | Ignorar bloques de código fenced (` ```...``` `) e inline (`` `...` ``) |
| `--verbose, -v`     | Mostrar todos los matches, no sólo los 5 primeros por patrón            |
| `--patterns <ids>`  | Analizar sólo los patrones indicados (e.g. `--patterns 7,19,22`)        |
| `--threshold <n>`   | Sólo mostrar patrones con peso ≥ n                                      |
| `--help, -h`        | Mostrar ayuda                                                           |
| `--version`         | Mostrar versión                                                         |

Opciones específicas de `humanize`:

| Opción      | Descripción                                                     |
| ----------- | --------------------------------------------------------------- |
| `--autofix` | Aplicar correcciones automáticas seguras y escribirlas a stdout |

Opciones específicas de `compare`:

| Opción            | Descripción                 |
| ----------------- | --------------------------- |
| `--before <ruta>` | Archivo de versión anterior |
| `--after <ruta>`  | Archivo de versión nueva    |

Opciones específicas de `scan`:

| Opción                       | Descripción                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `--ext <lista>`              | Extensiones a incluir, separadas por coma (default: `md,txt,rst,adoc`) |
| `--min-words <n>`            | Ignorar archivos con menos de n palabras                               |
| `--fail-above <n>`           | Salir con código 2 si algún archivo tiene score ≥ n                    |
| `--baseline <archivo>`       | Archivo JSON de scan previo para comparar                              |
| `--regression-threshold <n>` | Delta mínimo para considerar regresión (default: 1)                    |
| `--fail-on-regression`       | Salir con código 3 si hay regresiones                                  |
| `--ignore-dirs <lista>`      | Directorios extra a ignorar (se suman a los predefinidos)              |
| `--no-default-ignore`        | Desactivar la lista de ignores predefinida                             |
| `--config <archivo>`         | Cargar defaults de scan desde JSON                                     |

---

## Idiomas

El idioma por defecto es **español** (`es`). Para inglés: `--lang en`.

```bash
# Español (default)
humanizer analyze -f articulo.md
humanizer analyze -f articulo.md --lang es   # equivalente

# Inglés
humanizer analyze -f article.md --lang en
```

**Diferencias por idioma:**

| Aspecto             | Español (`es`)              | Inglés (`en`)              |
| ------------------- | --------------------------- | -------------------------- |
| Patrones activos    | PatternES-01 a PatternES-20 + PatternEN-7 | PatternEN-1 a PatternEN-29 |
| Métrica legibilidad | IFSZ (Flesch-Szigriszt)     | Flesch-Kincaid grade level |
| Vocabulario         | `src/locales/es.js`         | `src/vocabulary.js`        |
| Métrica adicional   | connector density           | —                          |

Los **20 patrones en español** detectan:

- Gerundios encadenados (_aprovechando las oportunidades, generando valor, facilitando el crecimiento_)
- Aperturas con contexto vago (_En el contexto actual de la transformación digital…_)
- Tríadas de abstractos (_eficiencia, innovación y sostenibilidad_)
- Tono sycofántico (_Excelente pregunta, es un honor…_)
- Énfasis metacomentario (_Es importante destacar, cabe señalar…_)
- Disclaimers de corte (_Como modelo de lenguaje, mi conocimiento…_)
- Conclusiones genéricas (_En conclusión, es fundamental…_)
- Atribuciones vagas (_Según los expertos, los estudios indican…_)
- Lenguaje excesivamente positivo (_innovador, revolucionario, transformador…_)
- Pasiva con _ser_ innecesaria (_es importante señalar que…_)
- Vocabulario IA en español (vocabulario inflado, frases características)

---

## Archivo de configuración

Crea `.humanizer.json` en la raíz del proyecto para guardar defaults de `scan`:

```json
{
  "scan": {
    "extensions": ["md", "txt"],
    "minWords": 30,
    "failAbove": 50,
    "baseline": ".humanizer-baseline.json",
    "regressionThreshold": 3,
    "failOnRegression": true,
    "ignoreDirs": ["generated", "vendor", "translations"],
    "includeDefaultIgnore": true,
    "ignoreCode": true
  }
}
```

Uso:

```bash
humanizer scan docs --config .humanizer.json
# Los flags CLI sobreescriben el config:
humanizer scan docs --config .humanizer.json --fail-above 40
```

**Campos del config:**

| Campo                  | Tipo     | Default                     | Descripción                       |
| ---------------------- | -------- | --------------------------- | --------------------------------- |
| `extensions`           | string[] | `["md","txt","rst","adoc"]` | Extensiones de archivo            |
| `minWords`             | number   | 1                           | Mínimo de palabras por archivo    |
| `failAbove`            | number   | null                        | Threshold de score para fallo     |
| `baseline`             | string   | null                        | Ruta al archivo baseline          |
| `regressionThreshold`  | number   | 1                           | Delta mínimo para regresión       |
| `failOnRegression`     | boolean  | false                       | Fallar si hay regresiones         |
| `ignoreDirs`           | string[] | []                          | Directorios extra a ignorar       |
| `includeDefaultIgnore` | boolean  | true                        | Usar lista predefinida de ignores |
| `ignoreCode`           | boolean  | false                       | Ignorar bloques de código         |

**Ignores predefinidos** (cuando `includeDefaultIgnore: true`):
`.git`, `node_modules`, `dist`, `.next`, `build`, `coverage`, `.cache`

---

## Uso en CI/CD

### GitHub Actions — gate básico

```yaml
name: AI writing gate
on: [pull_request]

jobs:
  humanizer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - name: Scan docs for AI patterns
        run: node src/cli/index.js scan docs --ext md --fail-above 50 --ignore-code
```

### GitHub Actions — gate con baseline

```yaml
- name: Scan (baseline regression gate)
  run: |
    node src/cli/index.js scan docs \
      --baseline .humanizer-baseline.json \
      --fail-on-regression \
      --regression-threshold 5
```

### Pre-commit hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

STAGED_MD=$(git diff --cached --name-only --diff-filter=AM | grep '\.md$')
if [ -n "$STAGED_MD" ]; then
  for f in $STAGED_MD; do
    SCORE=$(node src/cli/index.js score -f "$f" --json | jq -r '.score')
    if [ "$SCORE" -gt 60 ]; then
      echo "⚠️  $f score: $SCORE/100 — revisa el texto antes de hacer commit"
      exit 1
    fi
  done
fi
```

### Script de CI con JSON

```bash
#!/bin/bash
RESULT=$(humanizer scan docs --json)
AVG=$(echo "$RESULT" | jq '.summary.averageScore')
MAX=$(echo "$RESULT" | jq '.summary.maxScore')
FILES=$(echo "$RESULT" | jq '.files | length')

echo "Scanned $FILES files. Avg: $AVG, Max: $MAX"

if [ "$MAX" -gt 70 ]; then
  echo "Fail: max score $MAX > 70"
  exit 1
fi
```

---

## API programática

### Análisis básico

```javascript
const { analyze, score } = require('./src/core/analyzer');

// Score rápido
const s = score('Tu texto aquí', { lang: 'es' });
console.log(s); // 0-100

// Análisis completo
const result = analyze('Tu texto aquí', {
  lang: 'es', // 'es' | 'en'
  verbose: false, // true: todos los matches, false: max 5 por patrón
  ignoreCode: false, // true: ignora código fenced e inline
  includeStats: true, // false: omite estadísticas (más rápido)
  patternsToCheck: null, // [7, 19, 22]: sólo estos patrones
});

console.log(result.score); // 0-100
console.log(result.patternScore); // componente de patrones (70%)
console.log(result.uniformityScore); // componente estadístico (30%)
console.log(result.wordCount);
console.log(result.totalMatches);
console.log(result.reliability); // { level, score, reasons, recommendation }
console.log(result.stats); // métricas estadísticas
console.log(result.findings); // array de patrones detectados
console.log(result.categories); // agrupado por categoría
console.log(result.lang); // 'es' | 'en'
```

**Estructura de `result.findings`:**

```javascript
result.findings.forEach((finding) => {
  console.log(finding.patternId); // 'ES-07' | 'PatternEN-22'
  console.log(finding.patternName); // 'Conclusiones genéricas'
  console.log(finding.category); // 'content' | 'language' | 'style' | ...
  console.log(finding.weight); // 1-5
  console.log(finding.matchCount); // número total de coincidencias
  console.log(finding.truncated); // true si hay más de 5 matches (verbose=false)

  finding.matches.forEach((m) => {
    console.log(m.match); // texto que hizo match
    console.log(m.line, m.column); // posición en el texto
    console.log(m.suggestion); // cómo corregirlo
    console.log(m.confidence); // 'high' | 'medium' | 'low'
  });
});
```

### Humanización

```javascript
const { humanize, autoFix } = require('./src/core/humanizer');

const result = humanize('Tu texto aquí', {
  lang: 'es',
  autofix: false,
  includeStats: true,
  ignoreCode: false,
});

console.log(result.score);
console.log(result.totalIssues);
console.log(result.critical); // issues con weight >= 4
console.log(result.important); // issues con weight 2-3
console.log(result.minor); // issues con weight 1
console.log(result.guidance); // string[] con consejos de escritura
console.log(result.styleTips); // [{ metric, value, tip }]
console.log(result.analysis); // AnalysisResult completo

// Con autofix
const withFix = humanize('Tu texto', { autofix: true, lang: 'es' });
console.log(withFix.autofix.text); // texto corregido
console.log(withFix.autofix.fixes); // ['Removed filler: "in order to"', ...]

// Solo auto-fix (sin análisis de sugerencias)
const { text, fixes } = autoFix('Tu texto aquí');
console.log(text); // texto corregido
console.log(fixes); // lista de correcciones aplicadas
```

### Estadísticas

```javascript
const { computeStats, computeUniformityScore } = require('./src/core/stats');

const stats = computeStats('Tu texto aquí', 'es');

console.log(stats.wordCount);
console.log(stats.uniqueWordCount);
console.log(stats.sentenceCount);
console.log(stats.paragraphCount);
console.log(stats.avgSentenceLength);
console.log(stats.burstiness); // 0-1+, >0.5 es human-like
console.log(stats.typeTokenRatio); // 0-1, >0.5 es diverso
console.log(stats.trigramRepetition); // <0.05 es bueno
console.log(stats.ifsz); // legibilidad española (null en EN)
console.log(stats.fleschKincaid); // legibilidad inglesa (null en ES)
console.log(stats.hapaxLegomenaRate); // palabras que aparecen sólo 1 vez
console.log(stats.connectorDensity); // densidad de conectores (ES only)

const uniformity = computeUniformityScore(stats, 'es'); // 0-100
```

### Scan de directorio

```javascript
const { scanPath, compareScanResults, compareTexts, compareFiles } = require('./src/workflows');

// Scan
const scan = scanPath('docs', {
  exts: ['.md', '.txt'], // extensiones (con punto)
  minWords: 20, // ignorar archivos cortos
  ignoreCode: true, // ignorar código
  ignoreDirs: ['vendor'], // directorios extra a ignorar
  includeDefaultIgnore: true, // ignorar .git, node_modules...
  lang: 'es',
  includeStats: false, // más rápido sin estadísticas por archivo
});

console.log(scan.summary); // { scannedFiles, averageScore, maxScore... }
console.log(scan.files); // ordenado por score desc
console.log(scan.patternHotspots); // patrones más frecuentes entre archivos
console.log(scan.skipped); // archivos saltados y motivo

// Comparar dos scans
const baseline = JSON.parse(fs.readFileSync('.humanizer-baseline.json', 'utf8'));
const comparison = compareScanResults(scan, baseline, { regressionThreshold: 3 });

console.log(comparison.summary.regressions);
console.log(comparison.regressions); // [{ file, baselineScore, currentScore, delta }]
console.log(comparison.improvements);

// Comparar dos textos
const delta = compareTexts(textoBefore, textoAfter, { lang: 'es' });
console.log(delta.delta.score); // cambio en score (negativo = mejora)
console.log(delta.improvements);
console.log(delta.regressions);

// Comparar dos archivos
const delta2 = compareFiles('v1.md', 'v2.md', { lang: 'es' });
```

### Formatters (sin ANSI)

Los formatters producen texto plano, sin colores. Útil para exportar o integrar en pipelines.

```javascript
const { buildSummary, formatText, formatMarkdown, formatJSON } = require('./src/formatters/report');
const { formatGroupedSuggestions } = require('./src/formatters/suggestions');
const { formatStatsReport } = require('./src/formatters/stats');
const { formatScanReport, formatComparisonReport } = require('./src/formatters/scan');

const result = analyze(text, { lang: 'es' });

// Resumen de una línea
const summary = buildSummary(result);
// → "Este texto lightly AI-touched. 7 coincidencias en 3 tipos..."

// Reporte de texto plano
const plain = formatText(result);

// Reporte Markdown
const md = formatMarkdown(result);

// JSON
const json = formatJSON(result);

// Sugerencias agrupadas
const humanizeResult = humanize(text, { lang: 'es' });
const suggestions = formatGroupedSuggestions(humanizeResult);

// Estadísticas
const stats = computeStats(text, 'es');
const statsReport = formatStatsReport(stats);

// Scan
const scanResult = scanPath('docs');
const scanReport = formatScanReport(scanResult, 50 /* failAbove */);
```

---

## Referencia de patrones

→ Ver `knowledge/patterns-es.md` (PatternES-01 a PatternES-20) y `knowledge/patterns-en.md` (PatternEN-1 a PatternEN-29) para la referencia completa con descripciones y fixes.

---

## Métricas estadísticas

### Burstiness

Mide la variación en la longitud de las oraciones. El texto humano es "irregular": mezcla oraciones cortas y largas. El texto de IA es mecánicamente uniforme.

| Valor   | Interpretación                        |
| ------- | ------------------------------------- |
| > 0.6   | Variación natural, text humano        |
| 0.4–0.6 | Moderado                              |
| 0.2–0.4 | Algo uniforme, posible IA             |
| < 0.2   | Muy uniforme, alta probabilidad de IA |

### Type-Token Ratio (TTR)

Proporción de palabras únicas respecto al total. Valores más altos = vocabulario más diverso.

| Valor    | Interpretación             |
| -------- | -------------------------- |
| > 0.65   | Vocabulario muy diverso    |
| 0.5–0.65 | Diversidad normal          |
| 0.35–0.5 | Algo repetitivo            |
| < 0.35   | Vocabulario muy repetitivo |

**Nota:** En español el TTR natural es más alto (~1.7× el inglés) por la morfología rica.

### Repetición de trigramas

Fracción de trigramas (grupos de 3 palabras) que aparecen más de una vez. La IA reutiliza frases con más frecuencia.

| Valor     | Interpretación               |
| --------- | ---------------------------- |
| < 0.05    | Normal                       |
| 0.05–0.10 | Algo repetitivo              |
| > 0.10    | Alta repetición, probable IA |

### IFSZ (Flesch-Szigriszt, español)

Índice de legibilidad adaptado al español. Valores entre 0 y 100.

| Valor  | Nivel        |
| ------ | ------------ |
| 80–100 | Muy fácil    |
| 60–80  | Normal       |
| 40–60  | Algo difícil |
| 0–40   | Muy difícil  |

### Flesch-Kincaid (inglés)

Nivel de grado escolar equivalente. La IA tiende a escribir consistentemente en nivel 8–12.

### Connector Density (español)

Densidad de conectores lógicos (_sin embargo, por lo tanto, no obstante, además_). La IA usa conectores con frecuencia muy superior a los humanos.

---

## Cómo interpretar el score

El score (0–100) combina dos componentes:

```
Score = (Pattern Score × 0.70) + (Uniformity Score × 0.30)
```

- **Pattern Score** (70%): Basado en densidad de patrones detectados, con bonificaciones por amplitud (varios patrones distintos) y diversidad de categorías.
- **Uniformity Score** (30%): Basado en métricas estadísticas: burstiness, TTR, variación de oraciones, repetición de trigramas.

### Nivel de confiabilidad

Junto al score se muestra un nivel de confiabilidad:

| Nivel    | Significado                                      |
| -------- | ------------------------------------------------ |
| `high`   | Muestra suficiente (≥150 palabras, ≥5 oraciones) |
| `medium` | Muestra parcial (50–150 palabras)                |
| `low`    | Muestra insuficiente (<50 palabras)              |

Para scores bajos con texto corto, el análisis puede dar falsos negativos. La confiabilidad `high` requiere al menos 150 palabras.

---

## Códigos de salida

| Código | Cuándo ocurre                                                           |
| ------ | ----------------------------------------------------------------------- |
| `0`    | Éxito                                                                   |
| `1`    | Error: archivo no encontrado, argumento inválido, fallo de lectura      |
| `2`    | `--fail-above`: algún archivo escaneado tiene score ≥ threshold         |
| `3`    | `--fail-on-regression`: se encontraron regresiones respecto al baseline |

Los códigos 2 y 3 sólo aplican al comando `scan`.

---

## Recetas y casos de uso

### Revisar un artículo antes de publicar

```bash
humanizer humanize -f artículo.md
# Leer las sugerencias Critical primero
# Aplicar auto-fixes como punto de partida
humanizer humanize --autofix -f artículo.md > artículo-v2.md
# Verificar mejora
humanizer compare --before artículo.md --after artículo-v2.md
```

### Mantener score bajo en un blog

```bash
# Configurar en .humanizer.json
{
  "scan": {
    "extensions": ["md"],
    "failAbove": 40,
    "minWords": 100
  }
}

# Ejecutar en cada PR
humanizer scan _posts --config .humanizer.json
```

### Analizar sólo documentación técnica (ignorando código)

```bash
humanizer scan docs --ext md --ignore-code --fail-above 50
```

### Analizar un repositorio entero excepto carpetas generadas

```bash
humanizer scan . \
  --ext md,txt \
  --ignore-dirs generated,vendor,translations \
  --min-words 50 \
  --fail-above 60
```

### Pipeline CI con artefacto de informe

```bash
humanizer report -f article.md > artifacts/humanizer-report.md
humanizer scan docs --json > artifacts/scan-results.json
```

### Detectar regresiones automáticamente en PRs

```bash
# En la rama main, guardar baseline
humanizer scan docs --json > .humanizer-baseline.json
git add .humanizer-baseline.json && git commit -m "chore: update humanizer baseline"

# En cada PR
humanizer scan docs \
  --baseline .humanizer-baseline.json \
  --fail-on-regression \
  --regression-threshold 5
```

### Usar sólo la API para integración en editor

```javascript
const { analyze } = require('./src/core/analyzer');

// En un plugin de editor, analizar al guardar
function onSave(content, filePath) {
  const result = analyze(content, {
    lang: filePath.endsWith('.md') ? 'es' : 'en',
    includeStats: false, // más rápido
  });

  if (result.score > 50) {
    showWarning(`Score de IA: ${result.score}/100`);
    showFindings(result.findings.filter((f) => f.weight >= 3));
  }
}
```

### Procesar múltiples archivos en paralelo

```javascript
const { analyze } = require('./src/core/analyzer');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('docs/**/*.md');
const results = await Promise.all(
  files.map(async (f) => ({
    file: f,
    result: analyze(fs.readFileSync(f, 'utf8'), { lang: 'es', includeStats: false }),
  })),
);

results
  .sort((a, b) => b.result.score - a.result.score)
  .forEach(({ file, result }) => {
    console.log(`${result.score.toString().padStart(3)}/100  ${file}`);
  });
```
