'use strict';

const { getLocale } = require('../../locales');
const { DEFAULT_LANG } = require('../../constants');

class PatternRegistry {
  constructor() {
    this._patterns = new Map();
  }

  register(pattern) {
    this._patterns.set(pattern.id, pattern);
    return this;
  }

  get(id) {
    return this._patterns.get(id);
  }

  getAll() {
    return [...this._patterns.values()];
  }

  getByCategory(category) {
    return this.getAll().filter((p) => p.category === category);
  }

  getByLang(lang) {
    return this.getAll().filter((p) => p.langs.includes(lang));
  }

  getVocabulary(tier, lang = DEFAULT_LANG) {
    return getLocale(lang)[`TIER_${tier}`];
  }

  size() {
    return this._patterns.size;
  }
}

module.exports = { PatternRegistry };
