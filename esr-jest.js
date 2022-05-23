// @ts-check

// https://github.com/folke/esbuild-runner/issues/26#issuecomment-861656128

const _ = require('esbuild-runner/jest')

module.exports = {
  /**
   * @param {string} src
   * @param {string} filename
   * @returns {import('@jest/transform').TransformedSource} transformed source
   */
  process(src, filename) {
    return {
      code: _.default.process(src, filename),
    }
  },
}
