'use strict';

const fs = require('fs');
const path = require('path');

async function readFile(filePath) {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf-8');
  } catch (err) {
    throw new Error(`Could not read file: ${filePath} (${err.message})`);
  }
}

async function readStdin() {
  if (process.stdin.isTTY) {
    throw new Error('No input. Pipe text or use -f <file>. Run with --help for usage.');
  }
  const chunks = [];
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks.join('');
}

module.exports = { readFile, readStdin };
