# Roadmap

## Fase 0 — Hotfixes (inmediatos)

Bugs y deuda técnica urgente identificada en el análisis inicial.

- [ ] **Cachear `createPatterns()`** — se recrea en cada llamada a `analyze()`, debería cachearse en módulo-scope (`src/core/analyzer.js`)
- [ ] **Try-catch en detector de patrones** — si una regex lanza excepción, el proceso entero se cae sin catch (`src/core/analyzer.js` línea ~44)
- [ ] **Fixtures de tests faltantes** — 34 tests fallan por archivos `.txt` ausentes en `tests/fixtures/ai/gpt/`
- [ ] **Validar `lang`** — pasar un idioma inválido devuelve un locale vacío sin error (`src/core/analyzer.js`)
- [ ] **Campo `hapaxLegomenaRate` huérfano** — se calcula en `computeStats` pero nunca se usa en el score final

---

## Fase 1 — Test suite real y benchmarking

Antes de mejorar los algoritmos, necesitamos saber exactamente dónde fallamos.

- [ ] **Corpus de fixtures reales** — textos reales (IA vs humano) en español e inglés: artículos, emails, ensayos, posts, código con comentarios
- [ ] **Benchmark contra competidores** — comparar resultados de `humanizer score` contra GPTZero, Copyleaks y ZeroGPT para los mismos textos; documentar dónde ganamos y dónde perdemos
- [ ] **Tests de performance** — medir tiempo de `analyze()` en textos de distintos tamaños (1KB, 10KB, 100KB); definir presupuesto de tiempo (<200ms para 10KB)
- [ ] **Tests de falsos positivos** — textos humanos que el detector marca erróneamente como IA; especialmente textos académicos y corporativos
- [ ] **Tests de lenguaje mixto** — textos con mezcla de español e inglés
- [ ] **Cobertura de edge cases** — textos vacíos, solo código, solo números, unicode extremo, emojis

---

## Fase 2 — Mejoras de algoritmos

Con el benchmarking como guía, mejorar los algoritmos con mayor impacto.

- [ ] **Contador de sílabas EN** — la implementación actual es heurística (~10-15% error en polisílabas); considerar diccionario CMU Pronouncing o algoritmo Liang-Knuth
- [ ] **Verificar fórmula IFSZ** — hay dos variantes publicadas del Flesch-Szigriszt; confirmar cuál es la correcta y documentarla con fuente
- [ ] **Añadir índice SMOG** — más preciso que Flesch-Kincaid para español moderno; especialmente útil en textos cortos
- [ ] **Herdan's C para TTR** — sustituir o complementar el TTR simple con la versión normalizada que permite comparar textos de distinto largo
- [ ] **Activar `hapaxLegomenaRate` en el score** — integrar en `computeUniformityScore` con el peso apropiado
- [ ] **Análisis de estructura de párrafos** — detectar cuando todos los párrafos siguen la misma estructura (intro + desarrollo + cierre), señal estadística fuerte de IA
- [ ] **Detección automática de idioma** — heurística simple basada en frecuencia de palabras función (sin dependencias externas)

---

## Fase 3 — Patrones: calidad y cobertura

Reducir falsos positivos y ampliar la cobertura.

- [ ] **Reducir falsos positivos en PatternES-02** (apertura vaga) — afina el regex para no disparar en ensayos académicos legítimos con contexto real
- [ ] **Reducir falsos positivos en PatternEN-7** (vocabulario IA) — añadir contexto: "delve into the data" vs "delve into the literature" tienen distinto riesgo
- [ ] **Detección de transiciones repetidas entre párrafos** — "Furthermore... Moreover... Additionally..." en párrafos consecutivos es señal clara de IA no cubierta actualmente
- [ ] **Detección de patrones compuestos** — co-ocurrencia en el mismo texto de "rich tapestry" + "pivotal moment" + "delve" tiene más peso que cualquiera por separado
- [ ] **Patrones por dominio** — perfiles distintos para texto académico, corporativo y periodístico; cada dominio tiene señales IA diferentes
- [ ] **Autogenerar `knowledge/` desde código fuente** — actualmente se mantiene a mano; crear script que genere los `.md` automáticamente desde `src/core/patterns/*.js`
- [ ] **Ampliar a 60-70 patrones** — basado en los hallazgos del benchmarking (Fase 1)

---

## Fase 4 — Perfección de la skill

Cerrar los gaps entre lo que dice la skill y lo que hace el código.

- [ ] **Añadir pseudocódigo de detección de idioma** — actualmente la skill dice "detecta el idioma" pero eso no existe; documentar el proceso real o implementarlo
- [ ] **Documentar `--ignore-code` y todos los flags** en SKILL.md — actualmente no se menciona
- [ ] **Añadir casos de uso concretos** en SKILL.md — "analizar email sospechoso de bot", "revisar ensayo de estudiante", "auditar contenido de blog"
- [ ] **Tabla de patrones language-specific vs genéricos** — qué patrones son solo ES, solo EN, o ambos
- [ ] **Separar SKILL.md en secciones para agente vs usuario** — el agente necesita instrucciones operativas; el usuario que visita ClawHub necesita una portada distinta

---

## Fase 5 — MCP server y CLI completo

~~MCP: añadir `lang` a todas las herramientas~~ ✅ (completado en v3.2.x)

- [ ] **Flag `--output <archivo>`** en CLI — actualmente no hay forma de redirigir a archivo sin shell redirect
- [ ] **Validación de flags conflictivos** — `--json` + `--verbose` simultáneos tienen comportamiento no documentado
- [ ] **`humanizer scan` sin argumentos** — error genérico; mejorar mensaje de error
- [ ] **Output JSON limpio en MCP** — opción para devolver JSON estructurado en vez de Markdown con emojis, para uso programático
- [ ] **Tests del MCP server** — actualmente sin tests; añadir suite básica de integración

---

## Fase 6 — Estadísticas avanzadas

- [ ] **Análisis de complejidad sintáctica** — longitud de cláusulas subordinadas, profundidad de árbol sintáctico (heurística, sin parser completo)
- [ ] **Detección de "voice consistency"** — el texto humano tiene tics de escritura consistentes; el texto IA cambia de registro entre párrafos
- [ ] **Métricas por párrafo** — ahora solo hay métricas globales; un desglose por párrafo revelaría qué secciones son IA dentro de un texto mixto
- [ ] **Automated Readability Index** — tercera fórmula de legibilidad; triangular con IFSZ y SMOG
- [ ] **Análisis de puntuación** — uso de comas, punto y coma, dos puntos; el texto IA tiene densidad de comas muy regular

---

## Fase 7 — Detección de dialectos del español 🏁

El objetivo final del proyecto. Requiere completar todas las fases anteriores.

El español tiene variantes dialectales con marcadores lingüísticos claros que los modelos de IA actuales tienden a homogeneizar hacia un castellano neutro o peninsular. Detectar el dialecto permite:
1. Saber si un texto "español neutro" fue generado por IA (los hablantes nativos no escriben en neutro)
2. Verificar coherencia dialectal (texto que mezcla voseo rioplatense con léxico peninsular)

**Sub-tareas:**

- [ ] **Corpus dialectal** — recopilar textos reales etiquetados por variante: castellano peninsular, rioplatense, mexicano, caribeño, andino
- [ ] **Marcadores léxicos** — vocabulario exclusivo por región (vos/tú/usted, coche/carro/auto, ordenador/computadora/computador)
- [ ] **Marcadores morfosintácticos** — voseo verbal (vos tenés vs tú tienes), uso de pretérito perfecto vs indefinido, loísmo/leísmo
- [ ] **Marcadores fonológicos textuales** — seseo/distinción, yeísmo (en nombres propios y textos fonéticos)
- [ ] **Nuevo patrón `PatternES-DIAL`** — detectar mezcla incoherente de dialectos como señal de IA
- [ ] **Flag `--dialect`** — `es-ES`, `es-AR`, `es-MX`, `es-CO`, `es-neutral`
- [ ] **Score de coherencia dialectal** — qué tan consistente es el dialecto a lo largo del texto
