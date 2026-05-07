#!/usr/bin/env node
// src/cli/index.js
'use strict';

const { parseArgs, resolveOpts, showHelp, showVersion } = require('./flags');
const { readFile, readStdin } = require('./input');

const commands = {
  analyze:  require('./commands/analyze'),
  score:    require('./commands/score'),
  humanize: require('./commands/humanize'),
  report:   require('./commands/report'),
  suggest:  require('./commands/suggest'),
  stats:    require('./commands/stats'),
  scan:     require('./commands/scan'),
  compare:  require('./commands/compare'),
};

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { command, flags } = parsed;

  if (flags.help || !command) return showHelp();
  if (flags.version) return showVersion();

  const opts = resolveOpts(flags);

  let text = '';
  if (!['scan', 'compare'].includes(command)) {
    try {
      text = flags.file ? await readFile(flags.file) : await readStdin();
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    if (!text.trim()) {
      console.error('Error: Empty input.');
      process.exit(1);
    }
  }

  const cmd = commands[command];
  if (!cmd) {
    console.error(`Unknown command: "${command}". Run with --help for usage.`);
    process.exit(1);
  }

  try {
    await cmd.run(text, opts, flags);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
