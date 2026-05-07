/**
 * index.js — Locale selector.
 */
function getLocale(lang = 'es') {
  if (lang === 'en') return require('./en');
  return require('./es');
}

module.exports = { getLocale };
