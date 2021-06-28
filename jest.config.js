// @ts-check

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  transform: {
    '\\.ts$': './esr-jest',
  },
}

module.exports = config
