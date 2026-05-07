'use strict';

const { computeStats } = require('../../core/stats');
const { stripCodeSnippets } = require('../../core/utils');
const { renderStats } = require('../renderer');

async function run(text, opts, flags) {
  const statsText = opts.ignoreCode ? stripCodeSnippets(text) : text;
  const stats = computeStats(statsText, opts.lang);
  console.log(flags.json ? JSON.stringify(stats, null, 2) : renderStats(stats));
}

module.exports = { run };
