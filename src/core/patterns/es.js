const { findMatches } = require('./helpers');

const PATTERNS_ES = [
  {
    id: 'ES-01',
    name: 'Gerundio encadenado',
    category: 'language',
    langs: ['es'],
    description: 'Three or more gerunds (-ando/-iendo) in one sentence. AI chains gerunds where Spanish naturally uses subordinate clauses.',
    weight: 4,
    detect(text) {
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
    name: 'Tono sycofántico',
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
