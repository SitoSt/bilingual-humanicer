const { findMatches } = require('./helpers');

const PATTERNS_ES = [
  {
    id: 'ES-01',
    name: 'Gerundio encadenado',
    category: 'language',
    langs: ['es'],
    description:
      'Two or more gerunds chained in the same sentence.',
    weight: 4,
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
          ...findMatches(text, regex, 'Remove — start with a concrete fact or specific claim.', 'high'),
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
];

module.exports = PATTERNS_ES;
