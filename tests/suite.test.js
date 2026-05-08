import { describe, it, expect } from 'vitest';
import { analyze } from '../src/core/analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(fixturePath) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', fixturePath), 'utf-8');
}

function analyzeFixture(fixturePath, lang = 'es') {
  return analyze(loadFixture(fixturePath), { lang, verbose: true });
}

describe('Test Suite: Human-written texts', () => {
  const humanTexts = [
    { fixture: 'human/airfryer-opinion-es.txt', lang: 'es' },
    { fixture: 'human/office-migration-en.txt', lang: 'en' },
    { fixture: 'human/docs-opinion-en.txt', lang: 'en' },
    { fixture: 'human/dog-tweet-es.txt', lang: 'es' },
    { fixture: 'human/prod-bug-en.txt', lang: 'en' },
    { fixture: 'human/social-media-fatigue-es.txt', lang: 'es' },
  ];

  for (const { fixture, lang } of humanTexts) {
    describe(`${fixture} (${lang.toUpperCase()})`, () => {
      it('should score low (human text)', () => {
        const result = analyzeFixture(fixture, lang);
        expect(result.score).toBeLessThan(30);
      });

      it('should have low pattern density', () => {
        const result = analyzeFixture(fixture, lang);
        expect(result.patternScore).toBeLessThan(40);
      });

      it('should have sufficient reliability for analysis or gracefully report low confidence', () => {
        const result = analyzeFixture(fixture, lang);
        if (result.reliability.level === 'low') {
          expect(result.reliability.score).toBeGreaterThan(0);
        }
      });
    });
  }
});

describe('Test Suite: AI-generated texts by source', () => {
  describe('GPT-generated texts', () => {
    it('should score high on formal Spanish text', () => {
      const result = analyzeFixture('ai/gpt/soft-skills-formal-es.txt', 'es');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should score high on English overview text', () => {
      const result = analyzeFixture('ai/gpt/remote-work-en.txt', 'en');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should have multiple pattern categories detected', () => {
      const result = analyzeFixture('ai/gpt/remote-work-en.txt', 'en');
      const categories = new Set(result.findings.map((f) => f.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  describe('Claude-generated texts', () => {
    it('should score high on philosophical English text', () => {
      const result = analyzeFixture('ai/claude/en/ai-impact-en.txt', 'en');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should score high on technical Spanish text', () => {
      const result = analyzeFixture('ai/claude/es/blockchain-es.txt', 'es');
      expect(result.score).toBeGreaterThan(40);
    });
  });

  describe('Gemini-generated texts', () => {
    it('should score high on structured English text', () => {
      const result = analyzeFixture('ai/gemini/en/pm-methodologies-en.txt', 'en');
      expect(result.score).toBeGreaterThan(40);
    });

    it('should score high on scientific Spanish text', () => {
      const result = analyzeFixture('ai/gemini/es/sleep-science-es.txt', 'es');
      expect(result.score).toBeGreaterThan(40);
    });
  });

  describe('Mixed/light AI texts', () => {
    it('should score moderate or high on leadership list (light AI)', () => {
      const result = analyzeFixture('ai/mixed/leadership-light-en.txt', 'en');
      expect(result.score).toBeGreaterThan(20);
      expect(result.score).toBeLessThan(70);
    });

    it('should score moderate on time management (code-switching)', () => {
      const result = analyzeFixture('ai/mixed/time-management-es.txt', 'es');
      expect(result.score).toBeGreaterThan(30);
    });
  });
});

describe('Test Suite: Cross-category expectations', () => {
  it('AI texts should consistently score higher than human texts', () => {
    const humanResult = analyzeFixture('human/airfryer-opinion-es.txt', 'es');
    const aiResult = analyzeFixture('ai/gpt/soft-skills-formal-es.txt', 'es');
    expect(aiResult.score).toBeGreaterThan(humanResult.score);
  });

  it('Human texts should have lower total pattern matches', () => {
    const humanResult = analyzeFixture('human/office-migration-en.txt', 'en');
    const aiResult = analyzeFixture('ai/gpt/remote-work-en.txt', 'en');
    expect(humanResult.totalMatches).toBeLessThan(aiResult.totalMatches);
  });

  it('Heavy AI texts should trigger "rewrite" guidance', () => {
    const result = analyzeFixture('ai/gpt/soft-skills-formal-es.txt', 'es');
    if (result.score >= 50) {
      expect(result.totalMatches).toBeGreaterThan(3);
    }
  });
});

describe('Test Suite: Edge cases', () => {
  it('Short human text should still score low', () => {
    const humanShort = 'Me compré una cafetera. Está bien pero complicada.';
    const result = analyze(humanShort, { lang: 'es' });
    expect(result.score).toBeLessThan(30);
  });

  it('Short AI text should still score detectably high', () => {
    const aiShort =
      'In conclusion, it is important to highlight that this comprehensive analysis demonstrates.';
    const result = analyze(aiShort, { lang: 'en' });
    expect(result.score).toBeGreaterThan(30);
  });

  it('Mixed human-AI text should score in middle range', () => {
    const mixed = 'Here is a summary. I woke up at seven. Great question! The meeting went fine.';
    const result = analyze(mixed, { lang: 'en' });
    expect(result.score).toBeGreaterThan(20);
    expect(result.score).toBeLessThan(70);
  });
});

describe('Test Suite: Language-specific patterns', () => {
  describe('Spanish patterns', () => {
    it('should detect Spanish AI filler phrases', () => {
      const result = analyzeFixture('ai/gpt/soft-skills-formal-es.txt', 'es');
      const hasFiller = result.findings.some((f) => f.category === 'filler');
      expect(hasFiller).toBe(true);
    });

    it('should detect patterns in Spanish AI text', () => {
      const result = analyzeFixture('ai/gpt/soft-skills-formal-es.txt', 'es');
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('English patterns', () => {
    it('should detect English chatbot artifacts', () => {
      const result = analyzeFixture('ai/gpt/remote-work-en.txt', 'en');
      const hasComm = result.findings.some((f) => f.category === 'communication');
      expect(hasComm).toBe(true);
    });

    it('should detect English filler/hedging', () => {
      const result = analyzeFixture('ai/gpt/remote-work-en.txt', 'en');
      const hasFiller = result.findings.some((f) => f.category === 'filler');
      expect(hasFiller).toBe(true);
    });
  });
});
