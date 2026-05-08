#!/usr/bin/env node
// scripts/compare-fixtures.js
// Analyze all fixtures and show comparison table

const fs = require('fs');
const path = require('path');
const { analyze } = require('../src/core/analyzer');

const FIXTURES_DIR = path.join(__dirname, '..', 'tests', 'fixtures');

function loadFixtures(dir, baseCategory = '') {
  const results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      const subCategory = baseCategory ? `${baseCategory}/${item}` : item;
      results.push(...loadFixtures(itemPath, subCategory));
    } else if (item.endsWith('.txt')) {
      const fileLang = item.endsWith('-es.txt') ? 'es' : 'en';
      const text = fs.readFileSync(itemPath, 'utf-8');
      const result = analyze(text, { lang: fileLang, verbose: true });
      results.push({
        category: baseCategory || 'root',
        file: item,
        lang: fileLang,
        text: text.substring(0, 60) + '...',
        ...result,
      });
    }
  }
  return results;
}

function colorizeScore(score) {
  if (score <= 25) return `\x1b[32m${score}\x1b[0m`;
  if (score <= 50) return `\x1b[33m${score}\x1b[0m`;
  if (score <= 75) return `\x1b[35m${score}\x1b[0m`;
  return `\x1b[31m${score}\x1b[0m`;
}

function printTable(results) {
  const cols = {
    category: 12,
    file: 35,
    score: 8,
    patternScore: 12,
    matches: 10,
    words: 8,
    reliability: 12,
  };
  
  const header = Object.keys(cols).map((k, i) => {
    const labels = { category: 'CATEGORY', file: 'FILE', score: 'SCORE', patternScore: 'PATTERN', matches: 'MATCHES', words: 'WORDS', reliability: 'CONFIDENCE' };
    return labels[k].padEnd(cols[k]);
  }).join('  ');
  
  console.log('\n\x1b[1m' + header + '\x1b[0m');
  console.log('-'.repeat(header.length));
  
  for (const r of results) {
    const row = [
      r.category.padEnd(cols.category),
      r.file.padEnd(cols.file),
      colorizeScore(r.score).padEnd(cols.score),
      String(r.patternScore).padEnd(cols.patternScore),
      String(r.totalMatches).padEnd(cols.matches),
      String(r.wordCount).padEnd(cols.words),
      r.reliability.level.padEnd(cols.reliability),
    ];
    console.log(row.join('  '));
  }
  console.log('');
}

function printByCategory(results) {
  const grouped = {};
  for (const r of results) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }
  
  console.log('\n\x1b[1m=== ANALYSIS BY CATEGORY ===\x1b[0m\n');
  
  for (const [category, texts] of Object.entries(grouped)) {
    const avgScore = texts.reduce((sum, r) => sum + r.score, 0) / texts.length;
    const avgPattern = texts.reduce((sum, r) => sum + r.patternScore, 0) / texts.length;
    const avgReliability = texts.reduce((sum, r) => sum + r.reliability.score, 0) / texts.length;
    
    console.log(`\x1b[1m${category}/\x1b[0m (${texts.length} samples)`);
    console.log(`  Avg Score: ${colorizeScore(Math.round(avgScore))} | Pattern: ${Math.round(avgPattern)} | Confidence: ${Math.round(avgReliability)}`);
    console.log('  Files:', texts.map(t => t.file).join(', '));
    console.log('');
  }
}

function analyzeSpecific(fixturePath) {
  const fullPath = path.join(FIXTURES_DIR, fixturePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fixturePath}`);
    process.exit(1);
  }
  
  const text = fs.readFileSync(fullPath, 'utf-8');
  const lang = fixturePath.endsWith('-es.txt') ? 'es' : 'en';
  const result = analyze(text, { lang, verbose: true });
  
  console.log(`\n\x1b[1mAnalyzing: ${fixturePath}\x1b[0m\n`);
  console.log(`Score: ${colorizeScore(result.score)} (${result.reliability.level} confidence)\n`);
  
  console.log('\x1b[1mFindings:\x1b[0m');
  for (const f of result.findings) {
    const weightColor = f.weight >= 4 ? '\x1b[31m' : f.weight >= 2 ? '\x1b[33m' : '\x1b[34m';
    console.log(`  ${weightColor}[${f.patternId}]\x1b[0m ${f.patternName} (×${f.matchCount}, weight: ${f.weight})`);
    for (const m of f.matches.slice(0, 3)) {
      const preview = typeof m.match === 'string' ? m.match.substring(0, 70) : '';
      console.log(`    "${preview}${preview.length >= 70 ? '...' : ''}"`);
    }
  }
  
  console.log('\n\x1b[1mStats:\x1b[0m');
  console.log(`  Words: ${result.stats.wordCount}`);
  console.log(`  Burstiness: ${result.stats.burstiness.toFixed(3)} (${result.stats.burstiness >= 0.25 ? 'human-like' : 'AI-like'})`);
  console.log(`  Type-token ratio: ${result.stats.typeTokenRatio.toFixed(3)}`);
  console.log(`  Avg sentence length: ${result.stats.avgSentenceLength} words`);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  const allResults = loadFixtures(FIXTURES_DIR);
  printTable(allResults);
  printByCategory(allResults);
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node scripts/compare-fixtures.js [fixture-path]

Examples:
  node scripts/compare-fixtures.js              # Analyze all fixtures
  node scripts/compare-fixtures.js human/airfryer-opinion-es.txt  # Analyze specific fixture
`);
} else {
  analyzeSpecific(args[0]);
}
