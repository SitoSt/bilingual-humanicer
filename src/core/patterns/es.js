const { findMatches } = require('./helpers');

const PATTERNS_ES = [
  {
    id: 'ES-01',
    name: 'Gerundio encadenado',
    category: 'language',
    langs: ['es'],
    description: 'Two or more gerunds chained in the same sentence.',
    weight: 4,
    detect(text) {
      // Lowered from 3 to 2 gerunds — two chained gerunds is already a strong AI signal in Spanish
      const sentenceRegex = /[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*\b\w+(?:ando|iendo)\b[^.!?]*/gi;
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
    description:
      'Opening a paragraph or text with a vague contextual frame ("En el mundo actual..."). Classic AI opener in Spanish.',
    weight: 5,
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
        /^hoy en día[,]?\s+más que nunca/im,
        /^en pleno siglo (xxi|veintiuno)/im,
        /^en este (contexto|escenario|marco|entorno)[,\s]/im,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(
            text,
            regex,
            'Remove — start with a concrete fact or specific claim.',
            'high',
          ),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-03',
    name: 'Triada de abstractos',
    category: 'language',
    langs: ['es'],
    description:
      'Three abstract nouns or adjectives in a comma-separated list. AI groups ideas in compulsory triplets.',
    weight: 3,
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
  },

  {
    id: 'ES-04',
    name: 'Tono sycofántico',
    category: 'communication',
    langs: ['es'],
    description:
      'Spanish chatbot sycophantic openers — praising questions or showing excessive enthusiasm.',
    weight: 5,
    detect(text) {
      const patterns = [
        /\b(excelente|muy buena?|gran|magnífica|fantástica|estupenda) pregunta\b/gi,
        /\bme alegr[ao] (que me lo preguntes|de poder ayudarte|que (lo |)hayas preguntado)\b/gi,
        /\b¡(claro|por supuesto|desde luego)!\s+(con mucho gusto|estoy encantado|permíteme|te ayudo)\b/gi,
        /\bentiendo (tu|su) (preocupación|pregunta|punto de vista|inquietud)\b/gi,
        /\bespero haber (sido de ayuda|respondido (tu|su) pregunta|aclarado (tus|sus) dudas)\b/gi,
        /\bespero que (esto|esta información|esta respuesta) te haya (sido útil|ayudado|servido)\b/gi,
        /\bha sido un placer (ayudarte|atenderte|responderte|asistirte)\b/gi,
        /\bno dudes en (volver a )?(preguntar|consultarme|escribirme)\b/gi,
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
    description:
      'Meta-commentary that talks about what will be said instead of saying it. One of the strongest AI signals in Spanish.',
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
    name: 'Disclaimers de corte (español)',
    category: 'communication',
    langs: ['es'],
    description: 'Spanish knowledge-cutoff disclaimers. Always a chatbot artifact.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\bcomo modelo de lenguaje\b/gi,
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
    description:
      'Vague, optimistic closing statements. AI ends text with empty encouragement rather than concrete next steps.',
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
        /\btodo (apunta|indica|señala) a que\b/gi,
        /\bes (hora|momento) de (actuar|reflexionar|cambiar)\b/gi,
        /\bmarca un antes y un después\b/gi,
        /\ben este contexto[,\s]+resulta evidente que\b/gi,
        /\bestá claro que el futuro\b/gi,
        /\bsin duda alguna[,\s]/gi,
        /\bel reto (está|queda) en (nuestras|sus) manos\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(
            text,
            regex,
            'End with a specific fact or concrete plan instead.',
            'medium',
          ),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-08',
    name: 'Atribuciones vagas (español)',
    category: 'content',
    langs: ['es'],
    description:
      'Vague attributions to unnamed experts or studies. Spanish equivalent of English "experts believe".',
    weight: 4,
    detect(text) {
      const patterns = [
        /\blos expertos (señalan|indican|sostienen|afirman|coinciden en|aseguran)\b/gi,
        /\b(diversos|múltiples|varios|numerosos) estudios (demuestran|muestran|indican|sugieren|confirman|revelan)\b/gi,
        /\bsegún (los |)(especialistas|expertos|investigadores|analistas|académicos)\b/gi,
        /\bla evidencia (sugiere|muestra|indica|demuestra|apunta a) que\b/gi,
        /\bla (ciencia|comunidad científica|literatura científica) (dice|muestra|afirma|demuestra|señala)\b/gi,
        /\binvestigaciones (recientes |)(demuestran|muestran|sugieren|indican)\b/gi,
        /\blos datos (revelan|apuntan|confirman|evidencian)\b/gi,
        /\bla mayoría de (los expertos|los especialistas|los estudios)\b/gi,
        /\bse (sabe|ha demostrado|ha comprobado) que\b/gi,
        /\bestá (comprobado|demostrado|probado) que\b/gi,
        /\bfuentes (especializadas|autorizadas|consultadas) (indican|señalan|afirman)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(text, regex, 'Name a specific study or expert with a citation.', 'high'),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-09',
    name: 'Lenguaje excesivamente positivo',
    category: 'content',
    langs: ['es'],
    description:
      'AI uses 96-133% more positive emotional language than humans (arXiv:2505.01800). Flags inflated positive framing.',
    weight: 3,
    detect(text) {
      const patterns = [
        /\bresultados? (excelentes?|brillantes?|extraordinarios?|sobresalientes?|espectaculares?|increíbles?)\b/gi,
        /\bavance (significativo|revolucionario|extraordinario|sin precedentes|histórico|monumental)\b/gi,
        /\bun (gran|enorme|extraordinario|increíble|monumental|histórico) (paso|logro|éxito|avance|hito|resultado)\b/gi,
        /\bun (futuro|mañana) (mejor|más brillante|más prometedor|más justo)\b/gi,
        /\bimpacto (positivo|transformador|revolucionario|sin precedentes) en\b/gi,
        /\bexperiencia (única|enriquecedora|transformadora|inolvidable|gratificante)\b/gi,
        /\boportunidad (única|excepcional|irrepetible|histórica|inigualable)\b/gi,
        /\bhito (histórico|sin precedentes|fundamental|trascendental)\b/gi,
        /\b(nunca|jamás) (antes )?(habíamos|hemos) (visto|experimentado) (algo|nada) (igual|similar|parecido)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(
            text,
            regex,
            'Give concrete figures instead of inflated praise.',
            'medium',
          ),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-10',
    name: 'Pasiva con ser innecesaria',
    category: 'language',
    langs: ['es'],
    description:
      'AI overuses ser-passive (ha sido desarrollado por) where natural Spanish prefers se-passive or active voice. Likely English influence in training data.',
    weight: 2,
    detect(text) {
      const patterns = [
        // Original: ser-passive with agent ("por")
        /\b(ha|fue|es|será|han|fueron|son|serán|había|habían|sería|serían)\s+(sido\s+)?\w+ado\b[^.!?]{0,30}\bpor\b/gi,
        // NEW: modal + ser + participio
        /\b(debe|puede|tiene que|debería|tendría que)\s+ser\s+\w+(?:ado|ada|ido|ida)\b/gi,
        /\b(deben|pueden|tienen que|deberían|tendrían que)\s+ser\s+\w+(?:ados|adas|idos|idas)\b/gi,
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
  },
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
          ...findMatches(
            text,
            regex,
            'Start with the content directly — remove the framing.',
            'high',
          ),
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
        results.push(...findMatches(text, regex, 'Use "es/son" directly.', 'medium'));
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
        results.push(...findMatches(text, regex, 'Say it directly or omit it.', 'medium'));
      }
      return results;
    },
  },

  {
    id: 'ES-15',
    name: 'Paralelismo negativo',
    category: 'language',
    langs: ['es'],
    description: 'Formulaic "not only X but also Y" construct overused by AI in Spanish.',
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
          ...findMatches(
            text,
            regex,
            'Name the specific challenge or remove the framing.',
            'medium',
          ),
        );
      }
      return results;
    },
  },

  {
    id: 'ES-17',
    name: 'Estructura excesiva',
    category: 'style',
    langs: ['es'],
    description:
      'AI over-structures content with bold inline headers in bullet lists or excessive consecutive bullets.',
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
          if (count === 0) {
            startOffset = currentOffset;
          }
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
        /\ben este (artículo|post|texto|documento|ensayo) (vamos a|te\b|exploraremos|analizaremos|abordaremos|trataremos|veremos)/gi,
        /\ba lo largo de este (artículo|post|texto|documento|ensayo)\b/gi,
        /\ben las (siguientes|próximas) (líneas|páginas|secciones|palabras)\b/gi,
        /\beste (artículo|post|texto|documento) (tiene como objetivo|busca|pretende|se propone)\b/gi,
        /\ben esta (guía|entrada|publicación) (vamos a|exploraremos|analizaremos|abordaremos)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(
          ...findMatches(
            text,
            regex,
            'Start with the content directly — remove the meta-framing.',
            'high',
          ),
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
    description:
      'Closing phrases that expose chatbot origin. Almost never appear in human writing.',
    weight: 4,
    detect(text) {
      const patterns = [
        /\bespero que (esto|esta información|esta respuesta|todo esto) te haya (sido útil|ayudado|servido)\b/gi,
        /\bespero haber (sido de ayuda|respondido (tu|su) pregunta|aclarado (tus|sus) dudas)\b/gi,
        /\bno dudes en (preguntar|consultarme|escribirme|contactarme)(?: de nuevo| otra vez)?\b/gi,
        /\bsi (tienes|tiene) (alguna )?(otra )?(pregunta|duda|consulta)\b/gi,
        /¿hay algo más en lo que (pueda|te pueda|le pueda) (ayudar|asistir)/gi,
        /\bquedo a (tu|su) (disposición|entera disposición)\b/gi,
        /\bha sido un placer (ayudarte|atenderte|responderte|asistirte)\b/gi,
      ];
      const results = [];
      for (const regex of patterns) {
        results.push(...findMatches(text, regex, '(remove — end with actual content)', 'high'));
      }
      return results;
    },
  },

  {
    id: 'ES-20',
    name: 'Clickbait de guía',
    category: 'content',
    langs: ['es'],
    description: 'AI-generated article titles and section openers with clickbait formula patterns.',
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
];

module.exports = PATTERNS_ES;
