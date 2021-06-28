// @ts-check

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  collectCoverage: true,
  transform: {
    '\\.ts$': './esr-jest',
  },
}

module.exports = config
