'use strict';

const { analyze } = require('../../core/analyzer');
const { scoreBadge } = require('../renderer');

async function run(text, opts, flags) {
  const s = analyze(text, opts).score;
  if (flags.json) console.log(JSON.stringify({ score: s }));
  else            console.log(scoreBadge(s));
}

module.exports = { run };
