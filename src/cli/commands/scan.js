'use strict';

const { scanPath, compareScanResults } = require('../../workflows');
const { renderScan } = require('../renderer');
const { resolveScanOpts, loadConfig } = require('../flags');

async function run(text, opts, flags) {
  const target = flags.file || '.';

  let scanOptions;
  try {
    scanOptions = resolveScanOpts(flags);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const scanResult = scanPath(target, {
    exts:                 scanOptions.extensions || undefined,
    minWords:             scanOptions.minWords,
    ignoreDirs:           scanOptions.ignoreDirs,
    includeDefaultIgnore: scanOptions.includeDefaultIgnore,
    ignoreCode:           scanOptions.ignoreCode,
    lang:                 opts.lang,
  });

  let baselineComparison = null;
  if (scanOptions.baseline) {
    let baselinePayload;
    try {
      baselinePayload = loadConfig(scanOptions.baseline);
    } catch (err) {
      console.error(`Error: ${err.message.replace('config file', 'baseline file')}`);
      process.exit(1);
    }

    if (!Array.isArray(baselinePayload.files)) {
      console.error('Error: baseline file must contain a scan JSON object with a files array.');
      process.exit(1);
    }

    baselineComparison = compareScanResults(scanResult, baselinePayload, {
      regressionThreshold: scanOptions.regressionThreshold,
    });
  }

  const outputPayload = baselineComparison ? { ...scanResult, baselineComparison } : scanResult;

  if (flags.json) {
    console.log(JSON.stringify(outputPayload, null, 2));
  } else {
    console.log(renderScan(scanResult, scanOptions.failAbove, baselineComparison));
  }

  let exitCode = 0;
  if (scanOptions.failAbove !== null) {
    const hasFailure = scanResult.files.some((f) => f.score >= scanOptions.failAbove);
    if (hasFailure) exitCode = 2;
  }
  if (scanOptions.failOnRegression && baselineComparison && baselineComparison.summary.regressions > 0) {
    exitCode = exitCode || 3;
  }
  if (exitCode !== 0) process.exit(exitCode);
}

module.exports = { run };
