'use strict';

const fs = require('fs');
const path = require('path');
const { DEFAULT_LANG } = require('../constants');
const { normalizeExtensions } = require('../workflows');

// ─── ANSI color helpers (needed for showHelp) ─────────────
const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;

const color = {
  red: (s) => (supportsColor ? `\x1b[31m${s}\x1b[0m` : s),
  green: (s) => (supportsColor ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s) => (supportsColor ? `\x1b[33m${s}\x1b[0m` : s),
  blue: (s) => (supportsColor ? `\x1b[34m${s}\x1b[0m` : s),
  magenta: (s) => (supportsColor ? `\x1b[35m${s}\x1b[0m` : s),
  cyan: (s) => (supportsColor ? `\x1b[36m${s}\x1b[0m` : s),
  gray: (s) => (supportsColor ? `\x1b[90m${s}\x1b[0m` : s),
  bold: (s) => (supportsColor ? `\x1b[1m${s}\x1b[0m` : s),
  dim: (s) => (supportsColor ? `\x1b[2m${s}\x1b[0m` : s),
};

// ─── Scan Config Helpers ─────────────────────────────────

function parseNonNegativeInt(value, label) {
  if (value === undefined || value === null) return null;

  const n = parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return n;
}

function parseDirList(value, label) {
  if (value === undefined || value === null) return null;

  if (typeof value === 'string') {
    const dirs = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    return dirs.length > 0 ? dirs : [];
  }

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  throw new Error(`${label} must be a comma-separated string or array.`);
}

function parseExtensionList(value) {
  if (value === undefined || value === null) return null;

  if (typeof value === 'string') {
    const parts = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    return parts.length > 0 ? normalizeExtensions(parts) : [];
  }

  if (Array.isArray(value)) {
    return normalizeExtensions(value);
  }

  throw new Error('scan.extensions must be a comma-separated string or array.');
}

function loadConfig(configPath) {
  const resolved = path.resolve(configPath);

  let raw;
  try {
    raw = fs.readFileSync(resolved, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read config file: ${configPath} (${err.message})`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in config file ${configPath}: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Config file must contain a JSON object: ${configPath}`);
  }

  return parsed;
}

// ─── Arg Parsing ─────────────────────────────────────────

const KNOWN_COMMANDS = [
  'analyze',
  'score',
  'humanize',
  'report',
  'suggest',
  'stats',
  'scan',
  'compare',
];

/**
 * Parse process.argv-style array into structured flags object.
 *
 * @param {string[]} argv
 * @returns {{ command: string|null, flags: object }}
 */
function parseArgs(argv) {
  const command = argv[0] && !argv[0].startsWith('-') ? argv[0] : null;

  const flags = {
    json: argv.includes('--json'),
    verbose: argv.includes('--verbose') || argv.includes('-v'),
    autofix: argv.includes('--autofix'),
    help: argv.includes('--help') || argv.includes('-h'),
    version: argv.includes('--version'),
    failOnRegression: argv.includes('--fail-on-regression') ? true : null,
    includeDefaultIgnore: argv.includes('--no-default-ignore') ? false : null,
    ignoreCode: argv.includes('--ignore-code') ? true : null,
    file: null,
    before: null,
    after: null,
    patterns: null,
    threshold: null,
    config: null,
    extensions: null,
    minWords: null,
    failAbove: null,
    baseline: null,
    regressionThreshold: null,
    ignoreDirs: null,
    lang: DEFAULT_LANG,
  };

  // -f / --file
  const fileIdx = argv.indexOf('-f') !== -1 ? argv.indexOf('-f') : argv.indexOf('--file');
  if (fileIdx !== -1 && argv[fileIdx + 1]) flags.file = argv[fileIdx + 1];

  // Positional file (command <file>)
  if (!flags.file && argv[1] && !argv[1].startsWith('-') && !KNOWN_COMMANDS.includes(argv[1])) {
    flags.file = argv[1];
  }

  // --patterns flag (comma-separated pattern IDs)
  const patIdx = argv.indexOf('--patterns');
  if (patIdx !== -1 && argv[patIdx + 1]) {
    flags.patterns = argv[patIdx + 1]
      .split(',')
      .map(Number)
      .filter((n) => n > 0);
  }

  // --threshold flag
  const threshIdx = argv.indexOf('--threshold');
  if (threshIdx !== -1 && argv[threshIdx + 1]) {
    flags.threshold = parseInt(argv[threshIdx + 1], 10);
  }

  // --config flag
  const configIdx = argv.indexOf('--config');
  if (configIdx !== -1 && argv[configIdx + 1]) {
    flags.config = argv[configIdx + 1];
  }

  // --before and --after flags (compare command)
  const beforeIdx = argv.indexOf('--before');
  if (beforeIdx !== -1 && argv[beforeIdx + 1]) {
    flags.before = argv[beforeIdx + 1];
  }
  const afterIdx = argv.indexOf('--after');
  if (afterIdx !== -1 && argv[afterIdx + 1]) {
    flags.after = argv[afterIdx + 1];
  }

  // --ext flag (scan command)
  const extIdx = argv.indexOf('--ext');
  if (extIdx !== -1 && argv[extIdx + 1]) {
    flags.extensions = normalizeExtensions(argv[extIdx + 1].split(','));
  }

  // --min-words flag (scan command)
  const minWordsIdx = argv.indexOf('--min-words');
  if (minWordsIdx !== -1 && argv[minWordsIdx + 1]) {
    const n = parseInt(argv[minWordsIdx + 1], 10);
    if (!Number.isNaN(n) && n >= 0) flags.minWords = n;
  }

  // --fail-above flag (scan command)
  const failIdx = argv.indexOf('--fail-above');
  if (failIdx !== -1 && argv[failIdx + 1]) {
    const n = parseInt(argv[failIdx + 1], 10);
    if (!Number.isNaN(n) && n >= 0) flags.failAbove = n;
  }

  // --baseline flag (scan command)
  const baselineIdx = argv.indexOf('--baseline');
  if (baselineIdx !== -1 && argv[baselineIdx + 1]) {
    flags.baseline = argv[baselineIdx + 1];
  }

  // --regression-threshold flag (scan command)
  const regressionIdx = argv.indexOf('--regression-threshold');
  if (regressionIdx !== -1 && argv[regressionIdx + 1]) {
    const n = parseInt(argv[regressionIdx + 1], 10);
    if (!Number.isNaN(n) && n >= 0) flags.regressionThreshold = n;
  }

  // --ignore-dirs flag (scan command)
  const ignoreIdx = argv.indexOf('--ignore-dirs');
  if (ignoreIdx !== -1 && argv[ignoreIdx + 1]) {
    flags.ignoreDirs = argv[ignoreIdx + 1]
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  }

  // --lang flag (analysis language: en or es, default: es)
  const langIdx = argv.indexOf('--lang');
  if (langIdx !== -1 && argv[langIdx + 1]) {
    const rawLang = argv[langIdx + 1].toLowerCase();
    if (['en', 'es'].includes(rawLang)) {
      flags.lang = rawLang;
    } else {
      throw new Error(`Unsupported language "${rawLang}". Use --lang en or --lang es.`);
    }
  }

  return { command, flags };
}

/**
 * Resolve basic analysis opts from parsed flags.
 *
 * @param {object} flags
 * @returns {object}
 */
function resolveOpts(flags) {
  return {
    verbose: flags.verbose,
    patternsToCheck: flags.patterns,
    ignoreCode: flags.ignoreCode === true,
    lang: flags.lang || DEFAULT_LANG,
  };
}

/**
 * Resolve scan-specific options (config file + CLI flag merging).
 *
 * @param {object} flags
 * @returns {object}
 */
function resolveScanOpts(flags) {
  let config = {};
  const configPath = flags.config ? path.resolve(flags.config) : null;

  if (flags.config) {
    config = loadConfig(flags.config);
  }

  const scanConfig =
    config.scan && typeof config.scan === 'object' && !Array.isArray(config.scan)
      ? config.scan
      : {};

  const configExtensions = parseExtensionList(scanConfig.extensions);
  const configMinWords = parseNonNegativeInt(scanConfig.minWords, 'scan.minWords');
  const configFailAbove = parseNonNegativeInt(scanConfig.failAbove, 'scan.failAbove');
  const configRegressionThreshold = parseNonNegativeInt(
    scanConfig.regressionThreshold,
    'scan.regressionThreshold',
  );
  const configIgnoreDirs = parseDirList(scanConfig.ignoreDirs, 'scan.ignoreDirs');
  const configIncludeDefaultIgnore =
    typeof scanConfig.includeDefaultIgnore === 'boolean' ? scanConfig.includeDefaultIgnore : null;
  const configIgnoreCode =
    typeof scanConfig.ignoreCode === 'boolean' ? scanConfig.ignoreCode : null;
  const configFailOnRegression =
    typeof scanConfig.failOnRegression === 'boolean' ? scanConfig.failOnRegression : null;
  const configBaseline =
    typeof scanConfig.baseline === 'string' && scanConfig.baseline.trim()
      ? scanConfig.baseline
      : null;

  const extensions = flags.extensions || configExtensions;
  const minWords = flags.minWords !== null ? flags.minWords : (configMinWords ?? 1);
  const failAbove = flags.failAbove !== null ? flags.failAbove : configFailAbove;
  let baseline = flags.baseline || configBaseline;
  if (baseline && !path.isAbsolute(baseline)) {
    if (!flags.baseline && configPath) {
      baseline = path.resolve(path.dirname(configPath), baseline);
    } else {
      baseline = path.resolve(baseline);
    }
  }
  const regressionThreshold =
    flags.regressionThreshold !== null
      ? flags.regressionThreshold
      : (configRegressionThreshold ?? 1);
  const failOnRegression =
    flags.failOnRegression !== null ? flags.failOnRegression : (configFailOnRegression ?? false);
  const ignoreDirs = flags.ignoreDirs || configIgnoreDirs || undefined;
  const includeDefaultIgnore =
    flags.includeDefaultIgnore !== null
      ? flags.includeDefaultIgnore
      : (configIncludeDefaultIgnore ?? true);
  const ignoreCode = flags.ignoreCode !== null ? flags.ignoreCode : (configIgnoreCode ?? false);

  if (failOnRegression && !baseline) {
    throw new Error(
      'scan.failOnRegression requires --baseline <file> (or scan.baseline in config).',
    );
  }

  return {
    extensions,
    minWords,
    failAbove,
    baseline,
    regressionThreshold,
    failOnRegression,
    ignoreDirs,
    includeDefaultIgnore,
    ignoreCode,
  };
}

// ─── Help ────────────────────────────────────────────────

function showHelp() {
  console.log(`
${color.bold('humanizer')} — Detect and remove AI writing patterns

${color.bold('Usage:')}
  humanizer <command> [file] [options]

${color.bold('Commands:')}
  ${color.cyan('analyze')}      Full analysis report with pattern matches
  ${color.cyan('score')}        Quick score (0-100, higher = more AI-like)
  ${color.cyan('humanize')}     Humanization suggestions with guidance
  ${color.cyan('report')}       Full markdown report (for piping to files)
  ${color.cyan('suggest')}      Show only suggestions, grouped by priority
  ${color.cyan('stats')}        Show statistical text analysis only
  ${color.cyan('scan')}         Scan many files in a directory and rank by AI score
  ${color.cyan('compare')}      Compare before/after drafts and show score delta

${color.bold('Options:')}
  -f, --file <path>       Read text from file (otherwise reads stdin)
  --json                  Output as JSON
  --verbose, -v           Show all matches (not just top 5 per pattern)
  --autofix               Apply safe mechanical fixes (humanize only)
  --patterns <ids>        Only check specific pattern IDs (comma-separated)
  --threshold <n>         Only show patterns with weight above threshold
  --before <path>         Before file for compare command
  --after <path>          After file for compare command
  --ext <list>            File extensions for scan (e.g. md,txt,rst)
  --min-words <n>         Skip files shorter than n words (scan)
  --fail-above <n>        Exit non-zero if any scanned file score >= n
  --baseline <file>       Compare scan output against a prior scan JSON file
  --regression-threshold <n>  Min score delta to flag baseline regressions (default: 1)
  --fail-on-regression    Exit non-zero if baseline regressions are found
  --ignore-dirs <list>    Extra dirs to ignore when scanning (comma-separated)
  --no-default-ignore     Disable built-in ignores (.git,node_modules,dist,...)
  --ignore-code           Ignore fenced/inline code snippets during analysis
  --config <file>         Load scan defaults from JSON (scan section)
  --help, -h              Show this help

${color.bold('Examples:')}
  ${color.gray('# Quick score')}
  echo "This is a testament to..." | humanizer score

  ${color.gray('# Analyze a file')}
  humanizer analyze essay.txt

  ${color.gray('# Analyze docs while ignoring code examples')}
  humanizer analyze docs/guide.md --ignore-code

  ${color.gray('# Full markdown report')}
  humanizer report article.txt > report.md

  ${color.gray('# Just suggestions')}
  humanizer suggest article.txt

  ${color.gray('# Statistical analysis')}
  humanizer stats essay.txt

  ${color.gray('# Humanize with auto-fixes')}
  humanizer humanize --autofix -f article.txt

  ${color.gray('# Scan all markdown docs in a repo')}
  humanizer scan docs --ext md --fail-above 45

  ${color.gray('# Scan docs but ignore fenced/inline code snippets')}
  humanizer scan docs --ext md --ignore-code

  ${color.gray('# Scan a large codebase with config defaults')}
  humanizer scan . --config .humanizer.json --ignore-dirs vendor,generated

  ${color.gray('# Baseline-aware scan gating (regressions only)')}
  humanizer scan docs --json > .humanizer-baseline.json
  humanizer scan docs --baseline .humanizer-baseline.json --fail-on-regression

  ${color.gray('# Compare two drafts')}
  humanizer compare --before draft-v1.md --after draft-v2.md

${color.bold('Score badges:')}
  🟢 0-25    Mostly human-sounding
  🟡 26-50   Lightly AI-touched
  🟠 51-75   Moderately AI-influenced
  🔴 76-100  Heavily AI-generated
`);
}

function showVersion() {
  const pkg = require('../../package.json');
  console.log(pkg.version);
}

module.exports = { parseArgs, resolveOpts, resolveScanOpts, showHelp, showVersion, loadConfig };
