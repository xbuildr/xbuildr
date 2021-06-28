import { build } from 'esbuild'

import { COMMON_BUILD_OPTIONS } from './utils'

import { html } from '@esbuilder/html'

const main = async () => {
  await build({
    ...COMMON_BUILD_OPTIONS,
    minify: true,
    plugins: [html()],
  })
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
