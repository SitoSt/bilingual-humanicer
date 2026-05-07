'use strict';

const { analyze } = require('../../core/analyzer');
const { formatMarkdown } = require('../renderer');

async function run(text, opts, flags) {
  const result = analyze(text, { ...opts, verbose: true });
  console.log(formatMarkdown(result));
}

module.exports = { run };
