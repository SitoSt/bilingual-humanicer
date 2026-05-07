'use strict';

const { analyze } = require('../../core/analyzer');
const { renderReport, formatJSON } = require('../renderer');

async function run(text, opts, flags) {
  const result = analyze(text, opts);
  console.log(flags.json ? formatJSON(result) : renderReport(result, flags));
}

module.exports = { run };
