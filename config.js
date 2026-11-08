/**
 * Style Dictionary CLI entry point.
 *
 * The real configuration lives in style-dictionary.config.cjs. The CLI only
 * auto-discovers ./config.json or ./config.js and cannot load a .cjs config
 * (loadFile JSON5-parses unknown extensions), so this one-line shim lets
 * `pnpm tokens` keep invoking `style-dictionary build` unchanged.
 */
module.exports = require('./style-dictionary.config.cjs')
