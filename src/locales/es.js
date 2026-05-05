/**
 * es.js — Spanish vocabulary for AI detection.
 */

const TIER_1 = [
  'destacar', 'subrayar', 'enfatizar', 'recalcar', 'remarcar',
  'evidenciar', 'ilustrar', 'demostrar', 'revelar',

  'fundamental', 'crucial', 'esencial', 'primordial', 'indispensable',
  'imprescindible', 'invaluable', 'inestimable', 'trascendental',
  'revolucionario', 'innovador', 'vanguardista', 'disruptivo', 'pionero',
  'robusto', 'sólido', 'integral', 'holístico', 'exhaustivo',
  'meticuloso', 'riguroso', 'minucioso',

  'paradigma', 'sinergia', 'ecosistema', 'ámbito', 'panorama',
  'espectro', 'horizonte', 'tejido', 'esfera', 'dominio',

  'potenciar', 'optimizar', 'maximizar', 'aprovechar', 'impulsar',
  'catalizar', 'empoderar', 'apalancar', 'articular',
  'implementar', 'gestionar', 'promover', 'fomentar', 'garantizar',
];

const TIER_2 = [
  'asimismo', 'igualmente', 'del mismo modo', 'de igual manera',
  'por añadidura',

  'en consecuencia', 'por lo tanto', 'por ende', 'de ahí que',
  'de este modo', 'así pues', 'por consiguiente',

  'no obstante', 'sin embargo', 'a pesar de ello', 'con todo', 'si bien',

  'en efecto', 'de hecho', 'ciertamente', 'indudablemente',
  'sin duda', 'es evidente que', 'cabe destacar', 'cabe señalar',
  'cabe mencionar', 'es importante mencionar', 'es importante destacar',
  'es importante señalar', 'vale la pena destacar', 'vale la pena mencionar',
  'resulta fundamental', 'resulta esencial', 'resulta crucial',

  'en el mundo actual', 'en la actualidad', 'en el contexto actual',
  'hoy en día', 'en tiempos modernos', 'en la era digital',
  'en un mundo cada vez más', 'a lo largo de los años',
  'a lo largo de la historia', 'desde tiempos inmemoriales',

  'en primer lugar', 'en segundo lugar', 'en tercer lugar',
  'por un lado', 'por otro lado', 'finalmente',

  'en definitiva', 'en conclusión', 'en resumen', 'en última instancia',
  'para concluir', 'a modo de conclusión',

  'como se mencionó anteriormente', 'tal y como se indicó',
  'en este sentido', 'al respecto', 'como se puede observar',
  'como se puede ver',
];

const TIER_3 = [
  'significativo', 'relevante', 'notable', 'considerable', 'sustancial',
  'efectivo', 'eficiente', 'eficaz', 'productivo', 'exitoso',
  'único', 'especial', 'excepcional', 'extraordinario',
  'estratégico', 'estratégicamente', 'proactivo', 'dinámico',
  'sostenible', 'escalable', 'transformador', 'innovación',
  'digitalización', 'transformación', 'mejores prácticas',
  'valor añadido', 'propuesta de valor',
];

const AI_PHRASES = [
  { pattern: /\ben (el mundo|la sociedad|el contexto|la era|un mundo|nuestros días) actual/gi, tier: 1, fix: '(eliminar — ser específico sobre qué ha cambiado)' },
  { pattern: /\ben un mundo cada vez más\b/gi, tier: 1, fix: '(eliminar — ser específico)' },
  { pattern: /\ba lo largo de (los años|la historia|el tiempo)\b/gi, tier: 2, fix: '(dar fechas concretas)' },
  { pattern: /\bdesde tiempos inmemoriales\b/gi, tier: 2, fix: '(dar fecha concreta o eliminar)' },

  { pattern: /\bcabe (destacar|señalar|mencionar) que\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bes (importante|fundamental|esencial|crucial|necesario|vital) (tener en cuenta|señalar|mencionar|destacar|considerar) que\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bes fundamental (tener en cuenta|recordar|entender|señalar)\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bvale la pena (destacar|señalar|mencionar) que\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bresulta (fundamental|esencial|crucial|importante) (que|para|tener)\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bes de suma importancia\b/gi, tier: 1, fix: '(eliminar — decirlo directamente)' },
  { pattern: /\bno (hay|podemos) (que )?(olvidar|ignorar|pasar por alto) que\b/gi, tier: 2, fix: '(eliminar — decirlo directamente)' },

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

  { pattern: /\b(mi|este) conocimiento (tiene|llega hasta) (una |su )?(fecha|límite|corte)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bno tengo acceso a información en tiempo real\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bcomo modelo de lenguaje[, ]\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bte recomiendo verificar en fuentes (actualizadas|más recientes)\b/gi, tier: 2, fix: '(eliminar o citar la fuente directamente)' },
  { pattern: /\bhasta mi (fecha de corte|última actualización)\b/gi, tier: 1, fix: '(eliminar)' },
  { pattern: /\bsegún mi (última |más reciente )?(actualización|conocimiento|entrenamiento)\b/gi, tier: 1, fix: '(eliminar)' },

  { pattern: /\bel futuro (es|parece|luce|se ve) (prometedor|brillante|alentador)\b/gi, tier: 1, fix: '(terminar con un hecho concreto)' },
  { pattern: /\bqueda (mucho|bastante) (camino|trabajo) por (recorrer|hacer)\b/gi, tier: 2, fix: '(ser específico sobre qué falta)' },
  { pattern: /\bestamos ante un momento (histórico|crucial|decisivo|sin precedentes)\b/gi, tier: 1, fix: '(citar evidencia o eliminar)' },
  { pattern: /\bel camino por recorrer\b/gi, tier: 2, fix: '(ser específico)' },
  { pattern: /\bsolo el tiempo (dirá|lo dirá|nos lo dirá)\b/gi, tier: 2, fix: '(terminar con lo que sí sabes)' },
  { pattern: /\blas posibilidades son (infinitas|ilimitadas|enormes)\b/gi, tier: 2, fix: '(ser específico sobre qué es posible)' },

  { pattern: /\blos expertos (señalan|indican|sostienen|afirman|coinciden en)\b/gi, tier: 1, fix: '(citar un experto concreto con nombre)' },
  { pattern: /\b(diversos|múltiples|varios) estudios (demuestran|muestran|indican|sugieren)\b/gi, tier: 1, fix: '(citar un estudio concreto)' },
  { pattern: /\bsegún los (especialistas|expertos|investigadores|analistas)\b/gi, tier: 2, fix: '(nombrar a alguien concreto)' },
  { pattern: /\bla evidencia (sugiere|muestra|indica|demuestra) que\b/gi, tier: 2, fix: '(citar la evidencia específica)' },
  { pattern: /\bla (ciencia|literatura científica) (dice|muestra|afirma|demuestra)\b/gi, tier: 2, fix: '(citar un paper o estudio concreto)' },

  { pattern: /\bresultados? (excelentes?|brillantes?|extraordinarios?|sobresalientes?)\b/gi, tier: 2, fix: '(dar cifras concretas)' },
  { pattern: /\bavance (significativo|revolucionario|extraordinario|sin precedentes)\b/gi, tier: 2, fix: '(describir el avance concreto)' },
  { pattern: /\bun (gran|enorme|extraordinario|increíble) (paso|logro|éxito|avance|hito)\b/gi, tier: 2, fix: '(describir el logro concreto)' },

  { pattern: /\ben este artículo (vamos a|voy a|te) (explicar|explorar|analizar|mostrar)\b/gi, tier: 1, fix: '(eliminar — empezar con el contenido)' },
  { pattern: /\ba continuación (te |voy a |vamos a )?(presentar|explicar|analizar|mostrar|ver)\b/gi, tier: 2, fix: '(eliminar — empezar con el contenido)' },
  { pattern: /\bpermíteme (explicarte|presentarte|mostrarte|ayudarte)\b/gi, tier: 1, fix: '(eliminar — empezar con el contenido)' },

  { pattern: /\b(innovación|creatividad|transformación)[,] (innovación|creatividad|transformación) y (innovación|creatividad|transformación)\b/gi, tier: 2, fix: '(elegir uno y desarrollarlo)' },

  { pattern: /\bpodría (decirse|afirmarse|considerarse) que\b/gi, tier: 2, fix: '(decirlo directamente o no decirlo)' },
  { pattern: /\bdesde (cierta|alguna|una determinada) perspectiva\b/gi, tier: 2, fix: '(decir desde cuál perspectiva o eliminar)' },
  { pattern: /\bhasta cierto punto\b/gi, tier: 2, fix: '(ser preciso o eliminar)' },
  { pattern: /\ben cierta (medida|forma)\b/gi, tier: 2, fix: '(ser preciso o eliminar)' },
];

const FUNCTION_WORDS = [
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo',
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'durante',
  'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por',
  'según', 'sin', 'sobre', 'tras', 'al', 'del',
  'y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'sino', 'aunque',
  'que', 'si', 'porque', 'cuando', 'como', 'mientras', 'donde',
  'pues', 'ya',
  'yo', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
  'lo', 'la', 'los', 'las',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'aquel', 'aquella', 'aquellos', 'aquellas', 'esto', 'eso', 'aquello',
  'no', 'sí', 'también', 'tampoco', 'ya', 'aún', 'todavía',
  'siempre', 'nunca', 'jamás', 'aquí', 'ahí', 'allí', 'acá', 'allá',
  'ahora', 'antes', 'después', 'entonces', 'luego', 'hoy', 'muy',
  'más', 'menos', 'tan', 'tanto', 'bien', 'mal',
  'es', 'son', 'está', 'están', 'ha', 'han', 'hay', 'fue',
  'ser', 'estar', 'haber', 'tener', 'tiene', 'tienen',
];

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