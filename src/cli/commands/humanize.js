'use strict';

const { humanize } = require('../../core/humanizer');
const { formatSuggestions, color } = require('../renderer');

async function run(text, opts, flags) {
  const result = humanize(text, { ...opts, autofix: flags.autofix });
  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatSuggestions(result));
    if (flags.autofix && result.autofix) {
      console.log(`\n${color.bold('── AUTO-FIXED TEXT ──────────────────────────────')}\n`);
      console.log(result.autofix.text);
      console.log(`\n${color.dim('════════════════════════════════════════════════')}`);
    }
  }
}

module.exports = { run };
