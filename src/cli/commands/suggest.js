'use strict';

const { humanize } = require('../../core/humanizer');
const { renderSuggestions, formatJSON } = require('../renderer');

async function run(text, opts, flags) {
  const result = humanize(text, opts);
  console.log(flags.json ? formatJSON(result) : renderSuggestions(result));
}

module.exports = { run };
