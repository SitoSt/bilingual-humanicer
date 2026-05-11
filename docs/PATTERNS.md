# Pattern documentation

Detailed technical documentation for all AI writing patterns detected by humanizer.

> **Nota de Arquitectura:** Este documento es la **referencia técnica detallada** destinada exclusivamente a desarrolladores humanos para el mantenimiento y expansión del motor de detección. Los agentes de IA (como Claude Code, OpenClaw o servidores MCP) consumen las versiones optimizadas y simplificadas para el contexto ubicadas en `skill/knowledge/patterns-es.md` (y su equivalente en inglés). Al modificar o añadir patrones aquí, asegúrese de actualizar también la base de conocimiento en `skill/knowledge/` para mantener la consistencia en la reescritura.

## Overview

humanizer detects **48 patterns** across two languages:

- **English**: 29 patterns (PatternEN-1 through PatternEN-29)
- **Spanish**: 20 patterns (ES-01 through ES-20)

Patterns are grouped into five categories:

- **content**: What the text says (claims, attributions, significance)
- **language**: How ideas are expressed (vocabulary, syntax, parallelism)
- **style**: Visual and structural choices (formatting, emphasis, lists)
- **communication**: Conversational artifacts (chatbot leftovers, hedging)
- **filler**: Wordy phrases that add nothing (meta-commentary, generic conclusions)

---

## How detection works

Each pattern has a `detect(text)` function that returns an array of matches. Detection uses:

- **Regex matching** for vocabulary words, phrases, and structural patterns
- **Density analysis** for patterns that depend on frequency (em dashes, AI vocab)
- **Heuristic checks** for structural patterns (synonym cycling, rule of three)

Each match returns:

```javascript
{
  (match, index, line, column, suggestion, confidence);
}
```

Where `confidence` is `'high'`, `'medium'`, or `'low'`.

---

## Pattern weights

Patterns are weighted 1-5 based on how strongly they signal AI-generated text:

| Weight | Meaning         | English Patterns                                                                                                                                                                                                                                                                                   | Spanish Patterns                                                                                                                                                                                                                                                      |
| ------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5      | Dead giveaway   | AI vocabulary (EN-7), Chatbot artifacts (EN-19)                                                                                                                                                                                                                                                    | Sycophantic tone (ES-04), Apertura con contexto vago (ES-02)                                                                                                                                                                                                          |
| 4      | Strong signal   | Significance inflation (EN-1), Superficial -ing analyses (EN-3), Vague attributions (EN-5), Cutoff disclaimers (EN-20), Sycophantic tone (EN-21), Reasoning chain artifacts (EN-25), Acknowledgment loops (EN-28), Invisible unicode obfuscation (EN-29)                                           | Gerundio encadenado (ES-01), Énfasis metacomentario (ES-05), Disclaimers de corte (ES-06), Atribuciones vagas (ES-08), Framing de análisis (ES-11), Pregunta retórica de apertura (ES-13), Apertura de artículo formulaica (ES-18), Cierre de chatbot español (ES-19) |
| 3      | Moderate signal | Notability (EN-2), Promotional language (EN-4), Formulaic challenges (EN-6), Copula avoidance (EN-8), Negative parallelisms (EN-9), Inline-header lists (EN-15), Filler phrases (EN-22), Hedging (EN-23), Generic conclusions (EN-24), Excessive structure (EN-26), Confidence calibration (EN-27) | Triada de abstractos (ES-03), Conclusiones genéricas (ES-07), Lenguaje excesivamente positivo (ES-09), Copula avoidance española (ES-12), Hedging excesivo (ES-14), Paralelismo negativo (ES-15), Desafíos formulaicos (ES-16), Estructura excesiva (ES-17)           |
| 2      | Weak signal     | Rule of three (EN-10), Synonym cycling (EN-11), False ranges (EN-12), Em dash overuse (EN-13), Boldface overuse (EN-14), Emoji overuse (EN-17)                                                                                                                                                     | Pasiva con ser innecesaria (ES-10), Clickbait de guía (ES-20)                                                                                                                                                                                                         |
| 1      | Minor tell      | Title Case headings (EN-16), Curly quotes (EN-18)                                                                                                                                                                                                                                                  | —                                                                                                                                                                                                                                                                     |

---

## Scoring algorithm

The AI score (0-100) combines three components:

1. **Density score** (up to 65 points): Weighted matches per 100 words, on a logarithmic scale
2. **Breadth bonus** (up to 20 points): 2 points per unique pattern type detected
3. **Category bonus** (up to 15 points): 3 points per category with hits

The logarithmic curve prevents long texts from getting inflated scores just by having more words to match against.

---

## English Patterns (PatternEN-1 through PatternEN-29)

### Content Patterns

---

#### PatternEN-1: Significance inflation

**Category:** content | **Weight:** 4

Inflated claims about significance, legacy, or broader trends. LLMs puff up importance of mundane things.

**Detected phrases:**

- "marking a pivotal moment", "pivotal role", "key role", "crucial role", "vital role"
- "is a testament", "stands as a testament", "serves as a reminder"
- "reflects broader trends", "broader movement"
- "evolving landscape", "evolving world"
- "setting the stage for", "marking a shift", "key turning point"
- "indelible mark", "deeply rooted", "focal point"
- "symbolizing its ongoing", "enduring legacy", "lasting impact"
- "underscores the importance", "highlights the significance"
- "represents a shift", "shaping the future"
- "rich tapestry", "rich heritage"
- "stands as a beacon", "marks a milestone"
- "paving the way", "charting a course"

**Fix:** Remove inflated significance claim. State concrete facts instead.

**Example:**

- AI: "This breakthrough marks a pivotal moment in medical history, setting the stage for a new era of treatment."
- Human: "The drug reduced mortality by 30% in clinical trials."

---

#### PatternEN-2: Notability name-dropping

**Category:** content | **Weight:** 3

Listing media outlets or sources to claim notability without providing context or specific claims.

**Detected patterns:**

- Media outlet lists without specific claims: "cited in The New York Times, BBC, CNN..."
- "active social media presence" (meaningless without specifics)
- "written by a leading expert" (which expert?)
- "has been featured/recognized/acknowledged by..."

**Fix:** Instead of listing outlets, cite one specific claim from one source.

**Example:**

- AI: "Featured in Forbes, The New York Times, and TechCrunch."
- Human: "According to the 2024 Pew Research survey, 73% of Americans..."

---

#### PatternEN-3: Superficial -ing analyses

**Category:** content | **Weight:** 4

Tacking "-ing" participial phrases onto sentences to fake depth. AI adds trailing phrases like "highlighting the significance" or "underscoring the importance" that don't add real information.

**Detected phrases:**

- highlighting, underscoring, emphasizing, ensuring, reflecting
- symbolizing, contributing to, cultivating, fostering, encompassing
- showcasing, demonstrating, illustrating, representing, signaling
- indicating, solidifying, reinforcing, cementing, bolstering
- reaffirming, illuminating, epitomizing

**Fix:** Remove trailing -ing phrase. If the point matters, give it its own sentence with specifics.

**Example:**

- AI: "The company launched a new product, showcasing its commitment to innovation."
- Human: "The company launched a new product. Its stock rose 5% on the news."

---

#### PatternEN-4: Promotional language

**Category:** content | **Weight:** 3

Ad-copy language that sounds like a tourism brochure or press release. AI uses marketing vocabulary out of habit from training on marketing content.

**Detected words:**

- nestled, in the heart of, breathtaking, must-visit, stunning, renowned
- natural beauty, rich cultural heritage, rich history, commitment to
- exemplifies, world-class, state-of-the-art, game-changing, game changer
- unparalleled, profound, best-in-class, trailblazing, visionary
- cutting-edge, worldwide recognition

**Fix:** Replace promotional language with neutral, factual description.

**Example:**

- AI: "Nestled in the heart of the picturesque valley, the stunning resort offers world-class amenities..."
- Human: "The hotel is 3 miles from the airport. Rooms start at $180/night."

---

#### PatternEN-5: Vague attributions

**Category:** content | **Weight:** 4

Attributing claims to unnamed experts, industry reports, or vague authorities. AI was trained on text that uses "experts say" without naming them.

**Detected phrases:**

- "experts (believe|argue|say|suggest|note|agree|contend|have noted)"
- "industry (reports|observers|experts|analysts|leaders|insiders)"
- "observers have (cited|noted|pointed out)"
- "some critics argue", "some experts (say|believe|suggest)"
- "several sources", "according to reports"
- "widely (regarded|considered|recognized|acknowledged)"
- "it is widely (known|believed|accepted)"
- "many (experts|scholars|researchers|analysts) (believe|argue|suggest)"
- "studies (show|suggest|indicate|have shown)"
- "research (shows|suggests|indicates|has shown)"
- "sources close to", "people familiar with"

**Fix:** Name the specific source, study, or person. If you can't, remove the claim.

**Example:**

- AI: "Experts say the new policy will boost economic growth."
- Human: "The Congressional Budget Office projects 2.1% GDP growth in 2025."

---

#### PatternEN-6: Formulaic challenges

**Category:** content | **Weight:** 3

Boilerplate "Despite challenges... continues to thrive" sections. AI learned this pattern from business writing that always acknowledges challenges before pivoting.

**Detected phrases:**

- "despite (its|these|the|their) (challenges|setbacks|obstacles|difficulties|limitations)"
- "faces (several|many|numerous|various) challenges"
- "continues to thrive", "continues to grow"
- "future (outlook|prospects) (remain|look|appear)"
- "challenges and (future|legacy|opportunities)"
- "despite these (challenges|hurdles|obstacles)"
- "overcoming (obstacles|challenges|adversity)"
- "weather(ing|ed) the storm"

**Fix:** Replace with specific challenges and concrete outcomes.

**Example:**

- AI: "Despite challenges, the company continues to thrive and looks toward a promising future."
- Human: "Revenue fell 12% last year, but management projects recovery in Q3."

---

### Language Patterns

---

#### PatternEN-7: AI vocabulary

**Category:** language | **Weight:** 5

Words and phrases that appear far more frequently in AI-generated text. 500+ words tracked across 3 tiers.

**Tier system:**

- **Tier 1**: Always flag — these words are strong AI signals
- **Tier 2**: Flag only when 2+ tier-2 words appear (avoids false positives)
- **Tier 3**: Flag only at high density (>3% of words are tier-3)

Additionally flags AI phrases that don't start with "(remove" or "(eliminar".

**Fix:** Replace with simpler, more natural alternatives. Use concrete specifics instead of abstract buzzwords.

---

#### PatternEN-8: Copula avoidance

**Category:** language | **Weight:** 3

Using "serves as", "functions as", "boasts" instead of simple "is", "has", "are". AI learned to avoid simple verbs from training on more formal/academic writing.

**Detected patterns:**

- serves as (a)
- stands as (a)
- marks a
- represents a
- boasts (a|an|over|more)
- features (a|an|over|more)
- offers (a|an)
- functions as
- acts as (a)
- operates as (a)

**Fix:** Use simple "is", "are", or "has" instead.

**Example:**

- AI: "The program serves as a catalyst for innovation."
- Human: "The program drives innovation."

---

#### PatternEN-9: Negative parallelisms

**Category:** language | **Weight:** 3

"It's not just X, it's Y" or "Not only X but Y" constructions — overused by LLMs.

**Detected patterns:**

- "(it's|this is) not (just|merely|only|simply) ..., (it's|this is|but)"
- "not only ... but (also)?"

**Fix:** Rewrite directly. State what the thing IS, not what it "isn't just".

**Example:**

- AI: "It's not just about efficiency, it's about creating meaningful impact."
- Human: "Efficiency matters, but so does job satisfaction."

---

#### PatternEN-10: Rule of three

**Category:** language | **Weight:** 2

Forcing ideas into groups of three. LLMs love triads that sound "comprehensive". Detects both abstract noun triads and buzzy adjective triads.

**Abstract noun triad pattern:**

- `\w+tion, \w+ity, \w+ment, and \w+ence` at word boundaries

**Buzzy adjectives tracked:**

- seamless, intuitive, powerful, innovative, dynamic, robust, comprehensive
- cutting-edge, scalable, agile, efficient, effective, engaging, impactful
- meaningful, transformative, sustainable, resilient, inclusive, accessible

**Fix:** Pick the one or two that actually matter.

**Example:**

- AI: "We deliver seamless, intuitive, and powerful solutions."
- Human: "Our software takes 10 minutes to learn."

---

#### PatternEN-11: Synonym cycling

**Category:** language | **Weight:** 2

Referring to the same thing by different names in consecutive sentences to avoid repetition. AI learned this from writing advice that says "don't repeat words" — but overcorrects.

**Synonym sets tracked:**

- protagonist, main character, central figure, hero, lead character, lead
- company, firm, organization, enterprise, corporation, establishment, entity
- city, metropolis, urban center, municipality, locale, township
- building, structure, edifice, facility, complex, establishment
- tool, instrument, mechanism, apparatus, device, utility
- country, nation, state, republic, sovereign state
- problem, challenge, issue, obstacle, hurdle, difficulty
- solution, approach, methodology, framework, strategy, paradigm

**Detection:** If 3+ synonyms from the same set appear within 4 consecutive sentences.

**Fix:** Pick one term and stick with it.

---

#### PatternEN-12: False ranges

**Category:** language | **Weight:** 2

"From X to Y" where X and Y aren't on a meaningful scale. AI uses range language to sound comprehensive.

**Detected patterns:**

- Double ranges: "from X to Y, from Z to W"
- Abstract ranges: "from the dawn of... to the modern era", "from birth to afterlife"

**Fix:** Just list the topics. X and Y probably aren't on a meaningful scale.

**Example:**

- AI: "From startups to enterprises, from local teams to global corporations..."
- Human: "The software works for companies of all sizes."

---

### Style Patterns

---

#### PatternEN-13: Em dash overuse

**Category:** style | **Weight:** 2

LLMs overuse em dashes (—) as a crutch for punchy writing. Humans use them more sparingly.

**Detection:** Ratio > 1.0 em dashes per 100 words AND at least 2 em dashes total.

**Fix:** Replace most with commas, periods, or parentheses.

---

#### PatternEN-14: Boldface overuse

**Category:** style | **Weight:** 2

Mechanical emphasis of phrases in bold. AI uses **bold** as a highlighting crutch.

**Detection:** 3 or more `**bold**` patterns in the text.

**Fix:** Remove emphasis — let the writing carry the weight.

---

#### PatternEN-15: Inline-header lists

**Category:** style | **Weight:** 3

Lists where each item starts with a bolded header followed by a colon. AI learned this from templated content.

**Pattern:** `^[*-]\s+\*\*[^*]+:\*\*`

**Example:**

```markdown
- **Performance:** Fast and efficient
- **Scalability:** Grows with you
- **Security:** Enterprise-grade
```

**Fix:** Convert to a paragraph or use a simpler list.

---

#### PatternEN-16: Title Case headings

**Category:** style | **Weight:** 1

Capitalizing Every Main Word In Headings. AI chatbots default to this style even when sentence case is more natural.

**Detection:**

- Heading has 3+ words
- > 70% of words start with capital letter
- Common skip words: I, AI, API, CLI, URL, HTML, CSS, JS, TS, NPM, NYC, USA, UK, EU, LLM, GPT, SaaS, IoT, CEO, CTO, VP, PR, HR, IT, UI, UX

**Fix:** Use sentence case for headings (only capitalize first word and proper nouns).

---

#### PatternEN-17: Emoji overuse

**Category:** style | **Weight:** 2

Decorating headings or bullet points with emojis in professional/technical text. AI uses emojis to seem friendly and engaging.

**Detection:** 3 or more emoji characters from Unicode ranges:

- 😀-🧿 (1F300-1F9FF)
- ☀-⚿ (2600-27BF)
- ⌀-↏ (2300-23FF)
- ⭐ (2B50)

**Fix:** Remove emoji decoration from professional text.

---

#### PatternEN-18: Curly quotes

**Category:** style | **Weight:** 1

ChatGPT uses Unicode curly quotes (" " ' ') instead of straight quotes.

**Detection:** Any curly quote characters (U+201C, U+201D, U+2018, U+2019).

**Fix:** Replace curly quotes with straight quotes.

---

### Communication Patterns

---

#### PatternEN-19: Chatbot artifacts

**Category:** communication | **Weight:** 5

Leftover chatbot phrases that reveal AI origin. The strongest signal after AI vocabulary.

**Detected phrases:**

- "I hope this helps!"
- "Let me know if you need anything else"
- "Here is an overview"
- "Feel free to reach out"
- "I'd be happy to help"
- And other conversational closings

**Fix:** Remove entirely — these are never appropriate in human-written professional text.

---

#### PatternEN-20: Cutoff disclaimers

**Category:** communication | **Weight:** 4

AI knowledge-cutoff disclaimers left in text. AI models have a knowledge cutoff date and some responses include disclaimers about this.

**Detected phrases:**

- References to training data, cutoff dates, or "details may vary"
- "As of my last training..." or similar

**Fix:** Remove entirely. Readers don't need to know your model's training cutoff.

---

#### PatternEN-21: Sycophantic tone

**Category:** communication | **Weight:** 4

Overly positive, people-pleasing language. AI wants to be helpful and agreeable.

**Detected phrases:**

- "Great question!"
- "You're absolutely right!"
- "That's a fantastic point!"
- "I completely agree with your observation"
- "You've made an excellent choice"

**Fix:** Drop the validation. Just answer the question.

---

### Filler & Hedging Patterns

---

#### PatternEN-22: Filler phrases

**Category:** filler | **Weight:** 3

Wordy filler that can be shortened. AI learned to write formally, which often means more words.

**Examples:**

- "in order to" → "to"
- "due to the fact that" → "because"
- "at this point in time" → "now"
- "in the event that" → "if"
- "is able to" → "can"

**Fix:** Use the shorter alternative.

---

#### PatternEN-23: Excessive hedging

**Category:** filler | **Weight:** 3

Stacking qualifiers that weaken statements without adding information.

**Examples:**

- "could potentially possibly"
- "might arguably perhaps"
- "it is possible that perhaps"

**Fix:** Say it directly or don't say it.

---

#### PatternEN-24: Generic conclusions

**Category:** filler | **Weight:** 3

Vague upbeat endings that sound inspiring but say nothing.

**Detected phrases:**

- "The future looks bright"
- "Exciting times lie ahead"
- "The possibilities are endless"
- "A new era is upon us"

**Fix:** End with a specific fact or concrete plan instead.

---

### New Patterns (v2.2)

---

#### PatternEN-25: Reasoning chain artifacts

**Category:** communication | **Weight:** 4

Exposed chain-of-thought reasoning. AI sometimes shows its work, which humans rarely do.

**Detected phrases:**

- "Let me think..."
- "Breaking this down..."
- "Step 1:", "Step 2:", etc.
- "First, let's consider..."
- "Here's my thought process..."
- "Reasoning through this..."
- "Working through the logic..."

**Fix:** Hide reasoning or make it natural. "Here's my take:" instead of "Let me think step by step:"

---

#### PatternEN-26: Excessive structure

**Category:** style | **Weight:** 3

Over-formatted responses: too many headers, nested bullets, or numbered lists for simple content. AI over-structures because it's learned that structured output gets positive feedback.

**Detection triggers:**

- <300 words with 3+ headers
- <200 words with 8+ list items
- Headers named: "Overview:", "Key Points:", "Summary:", "Conclusion:", "Introduction:", "Background:"

**Fix:** Use prose instead of structure for short content.

---

#### PatternEN-27: Confidence calibration

**Category:** communication | **Weight:** 3

Artificially hedged or over-confident phrasing. AI signals its confidence poorly — either too much ("I'm confident that...") or too little ("It might possibly be...").

**Detected patterns:**

- "I'm confident (that|in)"
- "It's worth (noting|mentioning|pointing out)"
- "Interest(ingly|ingly enough)"
- "Surprisingly,"
- "Importantly,"
- "Significantly,"
- "Notably,"
- "Certainly,"
- "Undoubtedly,"
- "Without (a) doubt,"

**Fix:** State the fact without prefacing confidence or hedging.

---

#### PatternEN-28: Acknowledgment loops

**Category:** communication | **Weight:** 4

Restating the question before answering. AI often acknowledges the question to show it's listening.

**Detected phrases:**

- "You're asking about X. X is..."
- "The question of whether..."
- "When it comes to your question..."
- "In terms of your question..."
- "To answer your question..."
- "Your question about..."
- "That's a (great|good|interesting) question."
- "I understand you're (asking|wondering|curious)"

**Fix:** Just answer. Don't restate the question.

---

#### PatternEN-29: Invisible unicode obfuscation

**Category:** style | **Weight:** 4

Hidden unicode characters (zero-width chars, soft hyphens, non-breaking spaces) used to evade detectors or distort text. Some tools insert these to game AI detection systems.

**Detected characters:**

- Zero-width space (U+200B)
- Zero-width non-joiner (U+200C)
- Zero-width joiner (U+200D)
- Word joiner (U+2060)
- Zero-width no-break space (U+FEFF)
- Soft hyphen (U+00AD)
- Non-breaking space (U+00A0)
- Narrow no-break space (U+202F)

**Fix:** Remove hidden unicode characters. Replace non-breaking spaces with regular spaces unless formatting requires them.

---

## Spanish Patterns (ES-01 through ES-20)

### Language Patterns

---

#### ES-01: Gerundio encadenado

**Category:** language | **Weight:** 4

Two or more gerunds chained in the same sentence. AI chains gerunds because it learned Spanish grammar imperfectly from English-dominated training data.

**Detection:** Sentence containing two or more words ending in -ando or -iendo.

**Fix:** Rewrite with finite verbs and separate clauses instead of chained gerunds.

**Example:**

- AI: "Comenzamos analizando los datos, desarrollando estrategias y implementando soluciones."
- Human: "Analizamos los datos, desarrollamos estrategias e implementamos soluciones."

---

#### ES-03: Triada de abstractos

**Category:** language | **Weight:** 3

Three abstract nouns or adjectives in a comma-separated list. AI groups ideas in compulsory triplets even when they don't belong together.

**Abstract nouns tracked:**

- innovación, creatividad, transformación, eficiencia, productividad, excelencia
- sostenibilidad, transparencia, integridad, compromiso, visión, misión
- valores, estrategia, impacto, crecimiento, desarrollo, mejora
- calidad, rendimiento, liderazgo, talento, diversidad, inclusión
- bienestar, propósito, agilidad, resiliencia, colaboración, confianza
- empoderamiento, autenticidad, pasión, vocación, flexibilidad, adaptabilidad
- proactividad, cohesión, sinergia, equidad

**Pattern:** `abstracto, abstracto y abstracto`

**Fix:** Pick one concept and develop it concretely.

---

#### ES-10: Pasiva con ser innecesaria

**Category:** language | **Weight:** 2

AI overuses ser-passive ("ha sido desarrollado por") where natural Spanish prefers se-passive or active voice. This is likely English influence from training data.

**Detection:** Matches `ser` + past participle + "por" (agent), or modal + "ser" + participle.

**Fix:** Consider se-passive or active voice: "se ha desarrollado" or "los investigadores han desarrollado".

---

#### ES-12: Copula avoidance española

**Category:** language | **Weight:** 3

Avoiding "es/son" by substituting verbose copula equivalents. Borrowed from English AI training data that teaches "avoid simple verbs."

**Detected patterns:**

- "(sirve|sirven) como"
- "(actúa|actúan) como"
- "se (erige|erigen) como"
- "se (posiciona|posicionan) como"
- "se (presenta|presentan) como (un|una|el|la)"
- "desempeña(n)? (el|un) papel (de|fundamental|clave|crucial|central)"

**Fix:** Use "es/son" directly.

---

#### ES-15: Paralelismo negativo

**Category:** language | **Weight:** 3

Formulaic "not only X but also Y" construct overused by AI in Spanish.

**Detected patterns:**

- "no (solo|sólo) ... sino (también|que además|incluso)"
- "no únicamente ... sino (también|que)"
- "no meramente ... sino"
- "no simplemente ... sino"

**Fix:** Choose one idea and develop it directly.

---

### Content Patterns

---

#### ES-02: Apertura con contexto vago

**Category:** content | **Weight:** 5

Opening a paragraph or text with a vague contextual frame. Classic AI opener in Spanish.

**Detected patterns:**

- "En el mundo actual..."
- "En la sociedad actual..."
- "En el contexto actual..."
- "En la era digital/moderna/actual/tecnológica"
- "En el panorama actual..."
- "Vivimos en un momento..."
- "Nos encontramos ante un momento..."
- "En los últimos años..."
- "A lo largo de los últimos años..."
- "Hoy en día, más que nunca..."
- "En pleno siglo XXI..."
- "En este contexto/escenario/marco/entorno..."

**Fix:** Start with a concrete fact or specific claim.

---

#### ES-08: Atribuciones vagas

**Category:** content | **Weight:** 4

Vague attributions to unnamed experts or studies. Spanish equivalent of English "experts believe".

**Detected phrases:**

- "los expertos (señalan|indican|sostienen|afirman|coinciden en|aseguran)"
- "(diversos|múltiples|varios|numerosos) estudios (demuestran|muestran|indican|sugieren|confirman|revelan)"
- "según (los |)(especialistas|expertos|investigadores|analistas|académicos)"
- "la evidencia (sugiere|muestra|indica|demuestra|apunta a)"
- "la (ciencia|comunidad científica|literatura científica) (dice|muestra|afirma|demuestra|señala)"
- "investigaciones (recientes |)(demuestran|muestran|sugieren|indican)"
- "los datos (revelan|apuntan|confirman|evidencian)"
- "la mayoría de (los expertos|los especialistas|los estudios)"
- "se (sabe|ha demostrado|ha comprobar) que"
- "está (comprobado|demostrado|probado) que"
- "fuentes (especializadas|autorizadas|consultadas) (indican|señalan|afirman)"

**Fix:** Name a specific study or expert with a citation.

---

#### ES-09: Lenguaje excesivamente positivo

**Category:** content | **Weight:** 3

AI uses 96-133% more positive emotional language than humans (arXiv:2505.01800). Flags inflated positive framing.

**Detected patterns:**

- "(resultados?|avance|un (gran| gran|enorme|extraordinario|increíble|monumental|histórico) (paso|logro|éxito|avance|hito|resultado)) excelent(es|es|ente)|brillant(es|es|es)|extraordinari(o|os|a)|sobresalient(es|es)|espectacular(es|es)|increíbl(es|es)"
- "impacto (positivo|transformador|revolucionario|sin precedentes)"
- "experiencia (única|enriquecedora|transformadora|inolvidable|gratificante)"
- "oportunidad (única|excepcional|irrepetible|histórica|inigualable)"
- "hito (histórico|sin precedentes|fundamental|trascendental)"
- "(nunca|jamás) (antes )?(habíamos|hemos) (visto|experimentado) (algo|nada) (igual|similar|parecido)"

**Fix:** Give concrete figures instead of inflated praise.

---

#### ES-13: Pregunta retórica de apertura

**Category:** content | **Weight:** 4

AI hooks with a rhetorical question at the start of a paragraph or text. Rarely appears in human writing.

**Detected patterns:**

- "¿Alguna vez (te has|se ha) preguntado..."
- "¿Sabías que..."
- "¿Te (has dado cuenta|has puesto a pensar|has parado a pensar)..."
- "¿Qué (pasaría|ocurriría|sucedería) si..."
- "¿Cómo (es posible|puede ser|explicar) que..."
- "¿Por qué (es importante|deberíamos|merece la pena|debería importarnos)..."
- "¿(Has|hemos) (pensado|reflexionado|considerado) alguna vez..."

**Fix:** Start with the answer, not the question.

---

#### ES-16: Desafíos formulaicos

**Category:** content | **Weight:** 3

AI acknowledges challenges in a formulaic way before pivoting to optimism. Spanish equivalent of EN-6.

**Detected patterns:**

- "a pesar de (los|estos|dichos|los numerosos) (retos|desafíos|obstáculos|dificultades)"
- "si bien (existen|hay|persisten|se presentan) (retos|desafíos|obstáculos|dificultades)"
- "aunque (el camino|el proceso|la tarea|el reto) no (es|será|resulta|sea) (sencillo|fácil|simple|corto)"
- "los (retos|desafíos|obstáculos) (son|existen|persisten|son muchos|son numerosos) [...](pero|sin embargo|no obstante|aunque)"
- "no (es|será|resulta) (tarea|camino) (fácil|sencilla|simple)"

**Fix:** Name the specific challenge or remove the framing.

---

#### ES-20: Clickbait de guía

**Category:** content | **Weight:** 2

AI-generated article titles and section openers with clickbait formula patterns.

**Detected patterns:**

- "todo lo que (necesitas|debes) saber (sobre|acerca de)"
- "guía (completa|definitiva|esencial|práctica|paso a paso) (de|para|sobre)"
- "\d+ (cosas|razones|claves|aspectos|formas|maneras|pasos|consejos|secretos|trucos|errores) (que|para|de|sobre|a evitar)"
- "lo que (nadie te cuenta|no te dicen|no sabes) (sobre|acerca de|de)"
- "(todo|lo) que necesitas saber"

**Fix:** Write a specific, descriptive title instead.

---

### Communication Patterns

---

#### ES-04: Tono sycophantic

**Category:** communication | **Weight:** 5

Spanish chatbot sycophantic openers — praising questions or showing excessive enthusiasm.

**Detected phrases:**

- "(excelente|muy buena?|gran|magnífica|fantástica|estupenda) pregunta"
- "me alegr(ó|é) (que me lo preguntes|de poder ayudarte|que (lo |)hayas preguntado)"
- "¡(claro|por supuesto|desde luego)! (con mucho gusto|estoy encantado|permíteme|te ayudo)"
- "entiendo (tu|su) (preocupación|pregunta|punto de vista|inquietud)"
- "espero haber (sido de ayuda|respondido (tu|su) pregunta|aclarado (tus|sus) dudas)"
- "espero que (esto|esta información|esta respuesta) te haya (sido útil|ayudado|servido)"
- "ha sido un placer (ayudarte|atenderte|responderte|asistirte)"
- "no dudes en (volver a )?(preguntar|consultarme|escribirme)"

**Fix:** Get to the point. Don't praise the question or offer to help further.

---

#### ES-06: Disclaimers de corte (español)

**Category:** communication | **Weight:** 4

Spanish knowledge-cutoff disclaimers. Always a chatbot artifact.

**Detected phrases:**

- "como modelo de lenguaje"
- "no tengo acceso a información en tiempo real"
- "(hasta|en) mi (fecha de corte|última actualización|conocimiento más reciente)"
- "según mi (última |más reciente )?(actualización|conocimiento|entrenamiento|información)"
- "mis datos (llegan|van|alcanzan) hasta"
- "le recomiendo verificar en fuentes (actualizadas|más recientes|oficiales)"

**Fix:** Remove entirely.

---

#### ES-19: Cierre de chatbot español

**Category:** communication | **Weight:** 4

Closing phrases that expose chatbot origin. Almost never appear in human writing.

**Detected phrases:**

- "espero que (esto|esta información|esta respuesta|todo esto) te haya (sido útil|ayudado|servido)"
- "espero haber (sido de ayuda|respondido (tu|su) pregunta|aclarado (tus|sus) dudas)"
- "no dudes en (preguntar|consultarme|escribirme|contactarme)( de nuevo| otra vez)?"
- "si (tienes|tiene) (alguna )?(otra )?(pregunta|duda|consulta)"
- "¿hay algo más en lo que (pueda|te pueda|le pueda) (ayudar|asistir)"
- "quedo a (tu|su) (disposición|entera disposición)"
- "ha sido un placer (ayudarte|atenderte|responderte|asistirte)"

**Fix:** End with actual content, not an invitation to continue the conversation.

---

### Style Patterns

---

#### ES-17: Estructura excesiva

**Category:** style | **Weight:** 2

AI over-structures content with bold inline headers in bullet lists or excessive consecutive bullets.

**Detection triggers:**

- Bold inline header in bullet: `- **Header:** content`
- 5+ consecutive bullet lines

**Fix:** Use prose paragraphs; reserve bullets for genuinely list-like content.

---

### Filler Patterns

---

#### ES-05: Énfasis metacomentario

**Category:** filler | **Weight:** 4

Meta-commentary that talks about what will be said instead of saying it. One of the strongest AI signals in Spanish.

**Detected phrases:**

- "cabe (destacar|señalar|mencionar|resaltar|subrayar) que"
- "es (importante|fundamental|esencial|crucial|necesario|vital) (tener en cuenta|señalar|mencionar|destacar|considerar|recordar|entender) que"
- "es de suma importancia"
- "vale la pena (destacar|señalar|mencionar|resaltar) que?"
- "resulta (fundamental|esencial|crucial|importante|necesario) (que|para|entender|recordar)"
- "no (hay|podemos) (que )?(olvidar|ignorar|pasar por alto) que"
- "se debe (tener en cuenta|considerar|señalar|mencionar) que"
- "debe(ría)? tenerse en cuenta que"

**Fix:** State the fact directly. Don't announce that you're about to say something important.

---

#### ES-07: Conclusiones genéricas (español)

**Category:** filler | **Weight:** 3

Vague, optimistic closing statements. AI ends text with empty encouragement rather than concrete next steps.

**Detected phrases:**

- "el futuro (es|parece|luce|se ve|se presenta) (prometedor|brillante|alentador|esperanzador)"
- "estamos ante un momento (histórico|crucial|decisivo|clave|sin precedentes)"
- "solo el tiempo (dirá|lo dirá|nos lo dirá|podrá decirlo)"
- "las posibilidades son (infinitas|ilimitadas|enormes|vastas)"
- "queda (mucho|bastante|un largo) camino por recorrer"
- "el camino por recorrer (es|será) (largo|arduo|apasionante)"
- "una (nueva era|nueva etapa|nueva época) (se abre|comienza|está por comenzar)"
- "todo (apunta|indica|señala) a que"
- "es (hora|momento) de (actuar|reflexionar|cambiar)"
- "marca un antes y un después"
- "en este contexto, resulta evidente que"
- "está claro que el futuro"
- "sin duda alguna"
- "el reto (está|queda) en (nuestras|sus) manos"

**Fix:** End with a specific fact or concrete plan instead.

---

#### ES-11: Framing de análisis

**Category:** filler | **Weight:** 4

AI announces what it is about to analyze or explain instead of doing it directly.

**Detected phrases:**

- "procedemos a (analizar|explorar|examinar|ver|estudiar|revisar)"
- "comencemos por (entender|analizar|explorar|ver|revisar|examinar)"
- "a continuación (vamos a|exploraremos|analizaremos|veremos|abordaremos)"
- "antes de (responder|continuar|avanzar), es (importante|necesario|fundamental) (analizar|entender|explorar|considerar)"
- "permíteme (explicarte|presentarte|mostrarte|guiarte)"

**Fix:** Start with the content directly — remove the framing.

---

#### ES-14: Hedging excesivo

**Category:** filler | **Weight:** 3

Multiple hedges that weaken statements without adding information.

**Detected phrases:**

- "podría (decirse|considerarse|afirmarse|argumentarse|entenderse) que"
- "es posible (que|considerar|decir|afirmar)"
- "en cierta (medida|forma|manera)"
- "hasta cierto punto"
- "de alguna (manera|forma|modo)"
- "en algún sentido"
- "de cierta (forma|manera|modo)"
- "en mayor o menor medida"
- "en términos generales"
- "de (una forma|un modo) (u otra|u otro)"

**Fix:** Say it directly or omit it.

---

#### ES-18: Apertura de artículo formulaica

**Category:** filler | **Weight:** 4

AI announces article structure before writing it. Almost never appears in human writing.

**Detected phrases:**

- "en este (artículo|post|texto|documento|ensayo) (vamos a|te\b|exploraremos|analizaremos|abordaremos|trataremos|veremos)"
- "a lo largo de este (artículo|post|texto|documento|ensayo)"
- "en las (siguientes|próximas) (líneas|páginas|secciones|palabras)"
- "este (artículo|post|texto|documento) (tiene como objetivo|busca|pretende|se propone)"
- "en esta (guía|entrada|publicación) (vamos a|exploraremos|analizaremos|abordaremos)"

**Fix:** Start with the content directly — remove the meta-framing.

---

## Adding new patterns

To add a new pattern to `src/core/patterns/en.js` or `src/core/patterns/es.js`:

1. Define the pattern object with `id`, `name`, `category`, `description`, `weight`, and `detect(text)` function
2. The detect function must return `{ match, index, line, column, suggestion, confidence }`
3. Use the `findMatches()` helper for regex-based detection
4. Add tests in `tests/core/patterns/`
5. Document in this file

Example:

```javascript
{
  id: 'PatternEN-30',
  name: 'New pattern name',
  category: 'content', // or language, style, communication, filler
  description: 'What this pattern is and why it matters.',
  weight: 3,
  detect(text) {
    const regex = /your-pattern-here/gi;
    return findMatches(text, regex, 'Suggestion for fixing this pattern.');
  },
}
```

---

## Helper functions

The helpers module (`src/core/patterns/helpers.js`) provides:

- `findMatches(text, regex, suggestion, confidence)` — returns matches with location info
- `countMatches(text, regex)` — counts occurrences
- `wordCount(text)` — splits on whitespace, returns count
- `wordRegex(word)` — creates case-insensitive word boundary regex
- `scanWordList(text, wordList, suggestion, confidence)` — scans for multiple words
- `scanPhrases(text, phraseList)` — scans for phrase objects with `.pattern` and `.fix`
