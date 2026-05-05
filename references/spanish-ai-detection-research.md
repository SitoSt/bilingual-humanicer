# Investigación: Detección de texto IA en español

Referencia técnica para el detector bilingüe. Documenta hallazgos académicos y empíricos
sobre patrones de escritura IA en español, métricas estadísticas y calibración de umbrales.

---

## 1. Por qué el español es diferente al inglés para detección de IA

### Morfología rica → TTR naturalmente más alto

El español es una lengua flexional: un verbo como *hablar* genera ~50 formas distintas
(hablo, hablas, habló, hablaremos...). El inglés produce 5 (*speak, speaks, spoke, speaking, spoken*).
Los adjetivos también concuerdan en género y número: *bueno, buena, buenos, buenas* son 4 tokens
donde el inglés tiene 1 (*good*).

**Consecuencia directa:** El TTR (diversidad léxica) base del español es ~1.7× el del inglés
en corpora comparables. *Fuente: "Entropy and type-token ratio in gigaword corpora",
Physical Review Research 2024 (arXiv:2411.10227).*

**Implicación para el detector:** Los umbrales de TTR calibrados para inglés no son válidos
para español. Hay que recalibrarlos. Un TTR de 0.45 es sospechoso en inglés pero puede ser
completamente normal en español.

### Frases más largas en español

El español periodístico tiene frases significativamente más largas que el inglés:
42-54 palabras/frase en El Diario vs. 19-28 en The Guardian. Los detectores calibrados
con texto inglés generarán falsos positivos en español si usan longitud de frase absoluta.

**Implicación:** Medir coeficiente de variación (CV = SD/media), no longitud absoluta.

### Detección en español es más difícil que en inglés (documentado)

El único benchmark académico serio específico para español (AuTexTification, IberLEF 2023,
160.000 textos) encontró:
- Mejor sistema ML en español: Macro-F1 = **0.7077**
- Mejor sistema ML en inglés: Macro-F1 = **0.8091**
- Con solo características lingüísticas (enfoque rule-based): **~70-81% accuracy**

---

## 2. Métricas estadísticas: qué son y qué valores usar

### TTR — Type-Token Ratio (Diversidad léxica)

**Fórmula:** `TTR = palabras_únicas / total_palabras`

**Problema:** El TTR bruto decrece con la longitud del texto. Variante robusta: **MATTR**
(Moving Average TTR) — calcular TTR en ventanas de 50 palabras y promediar.

**Hallazgo clave (Kendro, International Journal of Applied Linguistics, 2025):** Los LLMs
tienen diversidad léxica superficialmente *mayor* que los humanos, pero distribuyen las
palabras de forma más **uniforme** en el texto. Los humanos reusan palabras en clústeres
temáticos; la IA los esparce uniformemente.

**Indicador más útil:** No el TTR global, sino la **varianza del TTR entre ventanas/párrafos**.
- Texto humano: alta varianza (párrafo técnico vs. párrafo narrativo son muy diferentes)
- Texto IA: baja varianza (uniformidad artificial)

**Los modelos más nuevos son los menos humanos:** GPT-4.5 y o4-mini tienen distribución
léxica más uniforme que GPT-3.5. Los modelos avanzados son paradójicamente más detectables
por este método.

### Burstiness — Ritmo de variación de frases

**Fórmula:** `CV = desviación_estándar(longitudes_frase) / media(longitudes_frase)`

También llamado coeficiente de variación (CV). Un CV alto significa que las frases varían
mucho en longitud (humano); un CV bajo significa uniformidad (IA).

| Tipo de texto | CV (Burstiness) |
|---------------|-----------------|
| Escritura humana efectiva | 0.60 – 1.20 |
| Texto IA (ChatGPT, Claude, etc.) | 0.15 – 0.35 |
| Zona gris | 0.35 – 0.60 |

*Fuente: metodología GPTZero; valores de fuentes secundarias. Requieren calibración con
corpus español antes de producción.*

**Ajuste para español:** El español produce frases más largas por razones estructurales,
pero la IA mantiene la baja variación relativa. El CV es el indicador correcto
(no la longitud absoluta).

### HLR — Hapax Legomena Rate (Tasa de palabras únicas)

**Qué son los hapax:** Palabras que aparecen exactamente una vez en el texto.
*Hapax* es griego para "una sola vez".

**Fórmula:** `HLR = palabras_que_aparecen_1_vez / total_palabras_únicas`

**Por qué importa:** Los humanos usan palabras muy específicas del contexto: nombres de
lugares locales, apodos, términos técnicos de su profesión, modismos regionales. La IA
evita lo infrecuente. Resultado: **el texto IA tiene sistemáticamente menos hapax**.

*Fuente: "Differentiating Between Human-Written and AI-Generated Texts Using Automatically
Extracted Linguistic Features", MDPI Information 2025. Es una de las top-4 características
en StyloAI (arXiv:2405.10129).*

**Limitación:** Requiere mínimo 200 palabras para ser fiable. En español, la morfología
rica aumenta el número de hapax naturalmente (más formas verbales = más tokens únicos),
lo que potencialmente hace la métrica aún más discriminativa.

### IFSZ — Legibilidad Flesch-Szigriszt

**Por qué no usar Flesch-Kincaid inglés:** Fórmula calibrada para inglés. Produce
puntuaciones 12-13 puntos inferiores al IFSZ para el mismo texto español. Directamente
incorrecta para nuestra lengua.

**Fórmula IFSZ (Szigriszt-Pazos, 1993):**
```
IFSZ = 206.835 − (62.3 × sílabas/palabras) − (palabras/frases)
```

Escala INFLESZ (tabla de interpretación validada, Barrio-Cantalejo 2008):

| IFSZ | Nivel | Ejemplo de lector |
|------|-------|-------------------|
| < 40 | Muy difícil | Científico especializado |
| 40-54 | Algo difícil | Universitario |
| 55-64 | Normal | ESO/bachillerato |
| 65-79 | Bastante fácil | Público general |
| ≥ 80 | Muy fácil | Universal |

**Patrón IA observado (empírico):** La IA en español rara vez produce párrafos con IFSZ
< 45 o > 75. Siempre cae en la zona "normal-fácil" (55-70). Los humanos varían fuera
de ese rango con frecuencia.

**Indicadores a implementar:**
1. IFSZ por párrafo → **varianza entre párrafos** (baja varianza = sospechoso)
2. IFSZ absoluto por párrafo → penalizar si todos caen en 55-70

**Implementación:** Requiere contador de sílabas en español. Las reglas de silabación
española son algorítmicamente implementables. Ver sección 5 para referencia.

### Densidad de conectores discursivos

La IA sobreutiliza conectores explícitos (además, asimismo, en consecuencia, no obstante...)
porque refleja la estructura lógica de textos académicos en sus datos de entrenamiento.

**Fórmula:** `densidad = conectores_encontrados / total_frases`

- Texto humano formal: 0.20 – 0.30 conectores/frase
- Texto IA típico: > 0.40 – 0.50 conectores/frase

Esta es una de las métricas más directamente implementables y con mayor señal/ruido
en la práctica.

---

## 3. Patrones de escritura IA en español

### 3.1 Conectores sobreutilizados

La IA los apila aunque no sean lógicamente necesarios. Un humano usa 2-3 por párrafo;
la IA los encadena en cada frase.

**Aditivos:** además, asimismo, igualmente, también, del mismo modo, de igual manera,
por añadidura

**Causales/conclusivos:** por lo tanto, por ende, en consecuencia, de ahí que, de este
modo, así pues

**Adversativos:** sin embargo, no obstante, a pesar de ello, aunque, con todo, si bien

**De énfasis:** en efecto, de hecho, ciertamente, indudablemente, sin duda, es evidente que

**De enumeración:** en primer lugar / en segundo lugar / por último, por un lado / por
otro lado

**De resumen:** en resumen, en conclusión, en definitiva, en última instancia, finalmente,
para concluir

**De referencia interna:** como se mencionó anteriormente, tal y como se indicó,
en este sentido, al respecto

### 3.2 Frases de apertura típicas de IA

Plantillas de inicio de texto:
- "En el mundo actual / En la sociedad actual / En la era digital actual..."
- "En un mundo cada vez más [adjetivo]..."
- "Cuando se trata de [tema], es importante..."
- "[Tema] es un aspecto/elemento fundamental/esencial/clave que..."
- "A lo largo de los años / A lo largo de la historia..."

Plantillas de introducción a listas:
- "Dividámoslo en N partes clave"
- "Exploremos N aspectos fundamentales"
- "A continuación, veremos..."
- "En este artículo vamos a explorar..."

### 3.3 Frases de cierre típicas de IA

- "En conclusión, [repetición del argumento]"
- "Como hemos visto a lo largo de este texto..."
- "Como se puede observar / como se puede ver..."
- "Esperemos que esta información te haya sido útil"
- "Así que, como puedes ver..." (cierre circular)

### 3.4 Frases de énfasis metacomentario (altamente diagnósticas)

Cuando el texto habla sobre lo que va a decir en lugar de decirlo directamente:

- "Es importante tener en cuenta que..."
- "Es importante señalar que / cabe señalar que..."
- "Es fundamental / esencial recordar que..."
- "Vale la pena señalar / mencionar que..."
- "Cabe destacar que / mencionar que..."
- "No hay que olvidar que..."
- "Es de suma importancia..."
- "Debería tenerse en cuenta que..."

### 3.5 Vocabulario inflado (equivalentes españoles de palabras IA en inglés)

| Inglés sobreutilizado | Español equivalente sobreutilizado |
|-----------------------|------------------------------------|
| delve | explorar, ahondar, profundizar, adentrarse |
| pivotal | crucial, fundamental, clave, esencial, vital |
| meticulous | meticuloso, riguroso, minucioso |
| groundbreaking | revolucionario, innovador, vanguardista |
| ensure | asegurar, garantizar |
| streamline | optimizar, agilizar, dinamizar |
| leverage | aprovechar, potenciar |
| comprehensive | integral, exhaustivo, completo |
| holistic | holístico, integral |
| synergy | sinergia, sinérgico |
| landscape | panorama (metafórico) |
| realm | ámbito, esfera, dominio |
| robust | robusto, sólido |

**Vocabulario corporativo adicional observado en texto IA en español:**
eficiencia, optimización, implementación, integración, transformación, solución integral,
propuesta de valor, valor añadido, enfoque holístico, visión estratégica, ecosistema
(metafórico), empoderamiento, empoderar, digitalización, transformación digital,
mejores prácticas, buenas prácticas.

### 3.6 Construcciones gramaticales típicas de IA

**Gerundios encadenados** — La IA encadena gerundios donde el español prefiere subordinadas:

> IA: "El sistema fue diseñado buscando maximizar la eficiencia, asegurando el cumplimiento,
> permitiendo a los usuarios..."
>
> Humano: "El sistema se diseñó para maximizar la eficiencia. Cumple los objetivos y
> permite que los usuarios..."

Detector: 3+ gerundios en la misma frase.

**Pasiva con *ser* innecesaria** — La IA sobreusa la pasiva con *ser* donde el español
natural usaría activa o pasiva refleja con *se*:

> IA: "Ha sido desarrollado un nuevo método por los investigadores"
> Humano: "Los investigadores han desarrollado un nuevo método" / "Se ha desarrollado..."

Posible influencia del inglés en los datos de entrenamiento.

**Frases triádicas obligatorias** — Grupos de exactamente 3 conceptos:
"rápido, eficiente y confiable", "claro, conciso y relevante", "innovador, sostenible
y transformador".

**Afirmaciones hipercalificadas** (RLHF-induced hedging):
"En muchos casos...", "En cierta medida...", "Hasta cierto punto...",
"Podría decirse que...", "Desde cierta perspectiva..."

**Patrón antítesis** — "No se trata de X, se trata de Y" con frecuencia
desproporcionada.

**Lenguaje excesivamente positivo** — La IA usa 96-133% más lenguaje positivo-emocional
que los humanos en noticias. "Resultados excelentes", "avance significativo", "futuro
prometedor", "logro extraordinario". *Fuente: arXiv:2505.01800, 2025.*

### 3.7 Artefactos de chatbot en español

**Sycofancias:**
- "¡Excelente pregunta!" / "¡Muy buena pregunta!" / "¡Gran pregunta!"
- "Claro que sí, con mucho gusto..." / "Por supuesto, estoy encantado de..."
- "Entiendo tu preocupación..." / "Me alegra que me lo preguntes..."

**Disclaimers de corte de conocimiento:**
- "Mi conocimiento tiene una fecha límite de..."
- "No tengo acceso a información en tiempo real, pero..."
- "Como modelo de lenguaje, no puedo..."
- "Te recomiendo verificar en fuentes actualizadas..."

**Advertencias éticas no solicitadas:**
- "Es importante abordar este tema con sensibilidad..."
- "Antes de continuar, debo señalar que..."
- "Este es un tema controvertido, objeto de debate..."

---

## 4. Palabras función en español (para análisis estilométrico)

Las palabras función son marcadores de estilo inconscientes — el autor no decide
conscientemente si usar "puesto que" o "ya que". Su distribución varía entre
autores humanos y entre humanos e IA.

**Artículos:** el, la, los, las, un, una, unos, unas

**Preposiciones:** a, ante, bajo, con, contra, de, desde, durante, en, entre,
hacia, hasta, mediante, para, por, según, sin, sobre, tras, al, del

**Conjunciones coordinantes:** y, e, ni, o, u, pero, mas, sino, aunque

**Conjunciones subordinantes:** que, si, porque, cuando, como, aunque, mientras,
donde, quien, cual, para que, pues, puesto que, ya que, dado que, siempre que

**Pronombres personales:** yo, tú, él, ella, usted, nosotros, vosotros, ellos,
ellas, ustedes, me, te, se, nos, os, le, les, lo, la, los, las

**Demostrativos:** este, esta, estos, estas, ese, esa, esos, esas, aquel, aquella,
aquellos, aquellas, esto, eso, aquello

**Adverbios gramaticales:** no, sí, también, tampoco, ya, aún, todavía, siempre,
nunca, jamás, aquí, ahí, allí, ahora, antes, después, entonces, luego, hoy,
ayer, mañana, muy, más, menos, tan, tanto, bien, mal

**El ratio esperado:** 45-55% de las palabras totales son palabras función en
texto español escrito.

---

## 5. Silabación en español (para IFSZ)

El IFSZ requiere contar sílabas. Las reglas principales:

**Vocales:** a, e, i, o, u, á, é, í, ó, ú, ü

**Diptongos (cuentan como 1 sílaba):** combinaciones de vocal fuerte (a,e,o) +
débil (i,u) o débil + fuerte: ai, au, ei, eu, oi, ia, ie, io, ua, ue, ui, uo

**Hiatos (cuentan como 2 sílabas):** dos vocales fuertes juntas (ae, ao, ea, eo,
oa, oe) o vocal débil tónica + fuerte (ía, úa, etc.)

**Aproximación práctica:** contar grupos de vocales consecutivas, descontar los
que forman diptongo, aplicar mínimo 1 sílaba por palabra.

---

## 6. Sesgo dialectal de los LLMs en español

*Fuente: arXiv:2602.09346 y Zenodo:16908971*

| Variedad | F1 en tarea de identificación dialectal (GPT-4o) |
|----------|--------------------------------------------------|
| España | 0.723 |
| México | 0.692 |
| Argentina | 0.665 |
| Chile | 0.372 |

Los LLMs están mejor calibrados para español peninsular y mexicano. El español
chileno y otras variedades periféricas están sistemáticamente peor representados.

**Efecto práctico:** La IA generando "español neutro" produce algo más cercano al
español peninsular o mexicano que al rioplatense o chileno. Ausencia de *vosotros*
en texto que dice ser de España puede ser señal.

**Implicación para v1:** No implementar dialect-awareness completo. Sí evitar que
el detector penalice vocabulario regional como sospechoso de IA.

---

## 7. Fuentes académicas clave

| Paper | Hallazgo principal | Año |
|-------|-------------------|-----|
| AuTexTification IberLEF 2023 (arXiv:2309.11285) | Benchmark ES/EN; F1=0.71 en español | 2023 |
| StyloAI (arXiv:2405.10129) | 81% accuracy rule-based; top-4 features | 2024 |
| Entropy & TTR gigaword (arXiv:2411.10227) | TTR español ~1.7× inglés | 2024 |
| Kendro, Int. J. Applied Linguistics | LLMs más nuevos menos humanos en léxico | 2025 |
| Psycholinguistic Analysis (arXiv:2505.01800) | IA usa 96-133% más lenguaje positivo | 2025 |
| Linguistic Bias in Spanish (arXiv:2602.09346) | Sesgo dialectal cuantificado | 2025 |

---

## 8. Limitaciones del enfoque rule-based

1. **Evasión trivial:** Un usuario que conoce las reglas puede pedirle a la IA que
   las evite. El sistema detecta IA "sin instrucciones", no IA instruida para evadir.

2. **Falsos positivos en texto académico formal:** La escritura académica española
   comparte algunos patrones con la IA (conectores, neutralidad, lenguaje impersonal).

3. **Textos cortos:** Ninguna métrica estadística es fiable por debajo de 150-200
   palabras. El detector debe advertir al usuario en esos casos.

4. **Textos híbridos:** Texto humano editado por IA (o viceversa) es especialmente
   difícil. La literatura estima mucho menor accuracy en textos híbridos.

5. **Calibración por dominio:** Los umbrales óptimos difieren entre géneros textuales.
   Un texto de marketing usa vocabulario "inflado" por convención, no por ser IA.
