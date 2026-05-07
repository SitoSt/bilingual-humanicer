'use strict';

const { compareFiles } = require('../../workflows');
const { renderComparison, formatJSON } = require('../renderer');

async function run(text, opts, flags) {
  if (!flags.before || !flags.after) {
    console.error('Error: compare requires --before <file> and --after <file>.');
    process.exit(1);
  }
  const result = compareFiles(flags.before, flags.after, { ignoreCode: opts.ignoreCode, lang: opts.lang });
  console.log(flags.json ? formatJSON(result) : renderComparison(result));
}

module.exports = { run };
