// tests/cli/input.test.js
import { describe, it, expect } from 'vitest';
import { readFile } from '../../src/cli/input.js';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const TMP = join(process.cwd(), 'tests/cli/_tmp_input_test.txt');

describe('readFile', () => {
  it('reads a file and returns its content', async () => {
    writeFileSync(TMP, 'hello world', 'utf-8');
    const content = await readFile(TMP);
    expect(content).toBe('hello world');
    unlinkSync(TMP);
  });

  it('throws a clear error for missing file', async () => {
    await expect(readFile('/tmp/nonexistent_xyz_abc.txt')).rejects.toThrow('Could not read file');
  });
});
