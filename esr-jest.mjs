// @ts-check

// https://github.com/folke/esbuild-runner/issues/26#issuecomment-861656128

import _ from 'esbuild-runner/jest.js'

/**
 * @param {string} src
 * @param {string} filename
 * @returns {{code: string, originalCode: string}} processed result
 */
function process(src, filename) {
  return {
    code: _.default.process(src, filename),
    originalCode: src,
  }
}

export default {
  process,
}
