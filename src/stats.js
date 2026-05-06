/**
 * stats.js — Text statistics engine.
 *
 * Computes stylometric features that distinguish AI from human writing.
 * Based on academic research (Copyleaks arxiv 2503.01659v1, StyloAI):
 *
 *   - Sentence length statistics (mean, std dev, variation coefficient)
 *   - Burstiness score (humans write in bursts/lulls; AI is uniform)
 *   - Vocabulary diversity (type-token ratio)
 *   - Function word ratio
 *   - N-gram repetition density
 *   - Readability metrics (Flesch-Kincaid)
 *   - Paragraph structure statistics
 */

const { getLocale } = require('./locales');
const { DEFAULT_LANG } = require('./constants');

// ─── Sentence Splitting ─────────────────────────────────

/**
 * Split text into sentences. Handles abbreviations and edge cases better
 * than a naive split on period.
 */
function splitSentences(text) {
  // Handle common abbreviations that shouldn't split
  const cleaned = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|etc|vs|approx|dept|est|vol)\./gi, '$1\u2024') // temp replace
    .replace(/\b([A-Z])\./g, '$1\u2024') // initials: "J. K. Rowling"
    .replace(/\b(\d+)\./g, '$1\u2024'); // numbered lists

  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z"'\u201C])|(?<=[.!?])$/)
    .map((s) => s.replace(/\u2024/g, '.').trim())
    .filter((s) => s.length > 0);

  return sentences;
}

// ─── Core Statistics ─────────────────────────────────────

/**
 * Tokenize text into words (lowercase, stripped of punctuation).
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Compute all text statistics.
 *
 * @param {string} text — Input text
 * @param {string} lang — Language code ('es' or 'en')
 * @returns {object}    — Statistics object
 */
function computeStats(text, lang = DEFAULT_LANG) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return emptyStats(lang);
  }

  const locale = getLocale(lang);
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (words.length === 0) return emptyStats(lang);

  // ── Word-level stats ────────────────────────────────
  const wordCount = words.length;
  const uniqueWords = new Set(words);
  const typeTokenRatio = uniqueWords.size / wordCount;

  // Average word length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

  // ── Sentence-level stats ────────────────────────────
  const sentenceLengths = sentences.map((s) => tokenize(s).length).filter((n) => n > 0);
  const sentenceCount = sentenceLengths.length;

  let avgSentenceLength = 0;
  let sentenceLengthStdDev = 0;
  let sentenceLengthVariation = 0;
  let burstiness = 0;

  if (sentenceCount > 1) {
    avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceCount;

    // Standard deviation
    const variance =
      sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) /
      sentenceCount;
    sentenceLengthStdDev = Math.sqrt(variance);

    // Coefficient of variation (std dev / mean) — our burstiness proxy
    sentenceLengthVariation = avgSentenceLength > 0 ? sentenceLengthStdDev / avgSentenceLength : 0;

    // Burstiness: based on consecutive sentence length differences
    // High burstiness = human (lots of variation between consecutive sentences)
    // Low burstiness = AI (uniform sentence length throughout)
    let consecutiveDiffSum = 0;
    for (let i = 1; i < sentenceLengths.length; i++) {
      consecutiveDiffSum += Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]);
    }
    const avgConsecutiveDiff = consecutiveDiffSum / (sentenceLengths.length - 1);
    burstiness = avgSentenceLength > 0 ? avgConsecutiveDiff / avgSentenceLength : 0;
  } else if (sentenceCount === 1) {
    avgSentenceLength = sentenceLengths[0];
  }

  // ── Function word ratio (locale-specific) ─────────────────
  const functionWordSet = new Set(locale.FUNCTION_WORDS);
  const functionWordCount = words.filter((w) => functionWordSet.has(w)).length;
  const functionWordRatio = functionWordCount / wordCount;

  // ── N-gram repetition ───────────────────────────────
  const trigramRepetition = computeNgramRepetition(words, 3);

  // ── Paragraph stats ─────────────────────────────────
  const paragraphCount = paragraphs.length;
  const avgParagraphLength =
    paragraphCount > 0
      ? paragraphs.reduce((sum, p) => sum + tokenize(p).length, 0) / paragraphCount
      : 0;

  // ── Readability (locale-specific) ─────────────────────
  let fleschKincaid = null;
  let ifsz = null;

  if (lang === 'en') {
    const syllableCount = words.reduce((sum, w) => sum + estimateSyllablesEN(w), 0);
    fleschKincaid =
      sentenceCount > 0
        ? 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59
        : 0;
  } else {
    // IFSZ (Flesch-Szigriszt) — Spanish readability formula
    const syllableCount = words.reduce((sum, w) => sum + estimateSyllablesES(w), 0);
    const rawIfsz =
      sentenceCount > 0
        ? 206.835 - 62.3 * (syllableCount / wordCount) - (wordCount / sentenceCount)
        : 0;
    ifsz = Math.max(0, Math.min(100, rawIfsz));
  }

  // ── Hapax Legomena Rate ──────────────────────────────
  const wordFreq = {};
  for (const w of words) wordFreq[w] = (wordFreq[w] || 0) + 1;
  const hapaxCount = Object.values(wordFreq).filter((c) => c === 1).length;
  const hapaxLegomenaRate = uniqueWords.size > 0 ? hapaxCount / uniqueWords.size : 0;

  // ── Connector Density (Spanish only) ────────────────
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

/**
 * Compute n-gram repetition rate.
 * Returns the fraction of n-grams that appear more than once.
 * AI text tends to reuse similar n-grams more than human text.
 */
function computeNgramRepetition(words, n) {
  if (words.length < n) return 0;

  const ngrams = {};
  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(' ');
    ngrams[gram] = (ngrams[gram] || 0) + 1;
  }

  const totalNgrams = Object.keys(ngrams).length;
  if (totalNgrams === 0) return 0;

  const repeated = Object.values(ngrams).filter((c) => c > 1).length;
  return repeated / totalNgrams;
}

/**
 * Estimate syllable count for a word (English heuristic).
 */
function estimateSyllablesEN(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  if (word.endsWith('e') && !word.endsWith('le')) count--;
  if (word.endsWith('ed') && word.length > 3 && !/[aeiouy]ed$/.test(word)) count--;

  return Math.max(count, 1);
}

/**
 * Estimate syllable count for a Spanish word.
 * Handles accented vowels, diphthongs, and hiatuses.
 * Rules:
 *   - Strong vowels: a e o (and accented á é ó)
 *   - Weak vowels: i u ü
 *   - Stressed weak vowels: í ú (always form hiatus — separate syllable)
 *   - Diphthong: two adjacent vowels with at least one weak and neither stressed
 *   - Hiato: vowels with consonant between, or strong+strong, or any with stressed weak
 *   - Triphthong: three adjacent weak vowels (only possible in forms like "buey")
 */
function estimateSyllablesES(word) {
  const clean = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (clean.length === 0) return 1;

  const STRESSED_WEAK = ['í', 'ú'];
  const WEAK = ['i', 'u', 'ü'];
  const VOWELS = ['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü'];

  const isVowel = (c) => VOWELS.includes(c);
  const isWeak = (c) => WEAK.includes(c);
  const isStressedWeak = (c) => STRESSED_WEAK.includes(c);

  // Find all vowel positions
  const vowelPositions = [];
  for (let i = 0; i < clean.length; i++) {
    if (isVowel(clean[i])) {
      vowelPositions.push(i);
    }
  }

  // No vowels -> 1 syllable (rare, like "y")
  if (vowelPositions.length === 0) return 1;

  // Each vowel is the start of a syllable by default
  // Only adjacent vowel pairs can be merged (dipthong/triphthong)
  let syllables = vowelPositions.length;

  // Scan consecutive vowel pairs (check adjacent in the original string)
  for (let idx = 0; idx < vowelPositions.length - 1; idx++) {
    const pos1 = vowelPositions[idx];
    const pos2 = vowelPositions[idx + 1];
    const gap = pos2 - pos1;

    // Only merge if vowels are adjacent (gap == 1)
    if (gap > 1) continue;

    const cur = clean[pos1];
    const next = clean[pos2];
    const curIsWeak = isWeak(cur);
    const nextIsWeak = isWeak(next);
    const curStressed = isStressedWeak(cur);
    const nextStressed = isStressedWeak(next);

    // Diphthong: both vowels weak (i, u) and neither stressed
    // weak + strong is ALWAYS hiatus, even if neither is stressed
    if (curIsWeak && nextIsWeak && !curStressed && !nextStressed) {
      syllables--;
      // Check for triphthong (third adjacent weak vowel)
      if (idx + 2 < vowelPositions.length) {
        const pos3 = vowelPositions[idx + 2];
        if (pos3 - pos2 === 1 && isWeak(clean[pos3])) {
          syllables--; // merge third weak too
        }
      }
    }
  }

  return Math.max(1, syllables);
}

/**
 * Compute a "uniformity score" from text stats.
 * Higher = more uniform/AI-like. Lower = more varied/human-like.
 * Range: 0-100.
 *
 * @param {object} stats — Statistics object from computeStats
 * @param {string} lang — Language code ('es' or 'en')
 */
function computeUniformityScore(stats, lang = DEFAULT_LANG) {
  if (stats.wordCount === 0) return 0;

  let score = 0;

  // Low burstiness = more AI-like (max 25 points)
  if (stats.burstiness < 0.2) score += 25;
  else if (stats.burstiness < 0.35) score += 18;
  else if (stats.burstiness < 0.5) score += 10;
  else if (stats.burstiness < 0.65) score += 5;

  // Low sentence length variation = more AI-like (max 25 points)
  if (stats.sentenceLengthVariation < 0.2) score += 25;
  else if (stats.sentenceLengthVariation < 0.35) score += 18;
  else if (stats.sentenceLengthVariation < 0.5) score += 10;
  else if (stats.sentenceLengthVariation < 0.65) score += 5;

  // Low type-token ratio = more repetitive/AI-like (max 20 points)
  // Spanish has naturally higher TTR (~1.7x English)
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

  // High trigram repetition = more AI-like (max 10 points)
  if (stats.trigramRepetition > 0.15) score += 10;
  else if (stats.trigramRepetition > 0.1) score += 6;
  else if (stats.trigramRepetition > 0.05) score += 3;

  // Low hapax legomena rate = more AI-like (max 10 points)
  // AI text has systematically lower HLR than humans
  if (stats.wordCount > 150) {
    if (stats.hapaxLegomenaRate < 0.30) score += 10;
    else if (stats.hapaxLegomenaRate < 0.45) score += 5;
  }

  // Connector density (Spanish only) (max 10 points)
  if (lang === 'es' && stats.connectorDensity !== null) {
    if (stats.connectorDensity > 0.5) score += 10;
    else if (stats.connectorDensity > 0.35) score += 5;
  }

  return Math.min(score, 100);
}

function emptyStats(lang = DEFAULT_LANG) {
  return {
    wordCount: 0,
    uniqueWordCount: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    avgWordLength: 0,
    avgSentenceLength: 0,
    sentenceLengthStdDev: 0,
    sentenceLengthVariation: 0,
    burstiness: 0,
    typeTokenRatio: 0,
    functionWordRatio: 0,
    trigramRepetition: 0,
    avgParagraphLength: 0,
    fleschKincaid: lang === 'en' ? 0 : null,
    ifsz: lang === 'es' ? 0 : null,
    hapaxLegomenaRate: 0,
    connectorDensity: lang === 'es' ? 0 : null,
    sentenceLengths: [],
  };
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

// ─── Exports ─────────────────────────────────────────────

module.exports = {
  computeStats,
  computeUniformityScore,
  computeNgramRepetition,
  splitSentences,
  tokenize,
  estimateSyllablesEN,
  estimateSyllablesES,
};
