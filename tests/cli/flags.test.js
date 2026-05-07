// tests/cli/flags.test.js
import { describe, it, expect } from 'vitest';
import { parseArgs, resolveOpts } from '../../src/cli/flags.js';

describe('parseArgs', () => {
  it('extracts command', () => {
    expect(parseArgs(['analyze', 'file.txt']).command).toBe('analyze');
  });

  it('sets file from positional arg', () => {
    expect(parseArgs(['analyze', 'file.txt']).flags.file).toBe('file.txt');
  });

  it('sets file from -f flag', () => {
    expect(parseArgs(['analyze', '-f', 'essay.md']).flags.file).toBe('essay.md');
  });

  it('defaults lang to es', () => {
    expect(parseArgs(['analyze']).flags.lang).toBe('es');
  });

  it('parses --lang en', () => {
    expect(parseArgs(['analyze', '--lang', 'en']).flags.lang).toBe('en');
  });

  it('throws on unknown lang', () => {
    expect(() => parseArgs(['analyze', '--lang', 'fr'])).toThrow('Unsupported language');
  });

  it('parses --json flag', () => {
    expect(parseArgs(['analyze', '--json']).flags.json).toBe(true);
  });

  it('parses --patterns flag', () => {
    expect(parseArgs(['analyze', '--patterns', '1,3,7']).flags.patterns).toEqual([1, 3, 7]);
  });

  it('returns null command when no command given', () => {
    expect(parseArgs(['--help']).command).toBeNull();
  });
});

describe('resolveOpts', () => {
  it('propagates lang from flags', () => {
    const { flags } = parseArgs(['analyze', '--lang', 'en']);
    expect(resolveOpts(flags).lang).toBe('en');
  });

  it('defaults lang to es', () => {
    const { flags } = parseArgs(['analyze']);
    expect(resolveOpts(flags).lang).toBe('es');
  });
});
