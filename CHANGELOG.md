# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2026-05-07

### Breaking Changes
- **Architecture refactor**: Codebase reorganized into horizontal layers (`core/` → `formatters/` → `cli/`). If you imported internal modules directly (e.g. `require('src/analyzer')`), update to `require('src/core/analyzer')`.
- **`analyze()` return value**: No longer includes a `summary` string field. Use `buildSummary(result)` from `src/formatters/report.js` instead.
- **`humanize()` return value**: Now includes an `analysis` field with the full analysis result.
- **CLI entry point**: Changed from `src/cli.js` to `src/cli/index.js`. The `humanizer` bin command is unchanged.
- **`package.json` `main`**: Changed from `src/analyzer.js` to `src/core/analyzer.js`.

### Added
- **`src/core/`**: Pure computation modules — `analyzer.js`, `humanizer.js`, `patterns/`, `stats.js`, `utils.js`.
- **`src/formatters/`**: Plain-text report formatters with zero ANSI codes — `report.js`, `suggestions.js`, `scan.js`, `stats.js`.
- **`src/cli/`**: CLI layer — `flags.js`, `input.js`, `renderer.js`, `commands/` (8 command modules), `index.js`.
- **`src/constants.js`**: Single source of truth for `DEFAULT_LANG`, `SCORE_THRESHOLDS`, `scoreLabel`, `CATEGORY_LABELS`.
- Integration tests for full EN + ES analysis pipelines (`tests/integration/`).

### Changed
- `scoreLabel` defined exactly once in `src/constants.js`; re-exported by `src/core/utils.js`.
- All ANSI escape sequences isolated to `src/cli/renderer.js`.
- No `console.log` calls in `src/core/` — pure computation only.

## [2.2.0] - 2025-04

### Added
- Bilingual support: Spanish (ES) as default language, English via `--lang en`.
- 10 Spanish-specific pattern detectors (ES-01 to ES-10): inflated vocabulary, over-used connectors, generic conclusions, gerund chains, AI metacommentary, and more.
- Spanish statistical metrics: IFSZ readability index, HLR (hapax legomena ratio), connector density.
- `--lang` flag threaded through all commands, analyzer, humanizer, and workflows.
- Spanish locale vocabulary (`src/locales/es.js`): TIER_1/2/3, AI phrases, connectors.

## [2.1.0] - 2025-03

### Added
- Confidence calibration with short-sample warnings.
- Baseline-aware scan regression gating (`--baseline`, `--fail-on-regression`).
- Code-aware ignore mode for technical docs (`--ignore-code`).
- Config-driven scan defaults via JSON (`--config`).
- Cross-file pattern hotspots in scan output.
- Draft comparison command (`compare`).
- Unicode obfuscation detection (pattern 29).

## [2.0.0] - 2025-02

### Added
- Repo scan command (`scan`) with `--fail-above`, `--ignore-dirs`, `--ext`.
- Statistical analysis: burstiness, type-token ratio, trigram repetition, sentence CoV, Flesch-Kincaid.
- Composite score (70% pattern + 30% uniformity).
- 29 pattern detectors with density-based scoring.
