import consola from 'consola'
import { serve } from 'esbuild'

import { COMMON_BUILD_OPTIONS } from './utils'

import html from '@xbuildr/html'

const main = async () => {
  const { host, port, stop } = await serve(
    {},
    {
      ...COMMON_BUILD_OPTIONS,
      plugins: [html({ serve: true })],
    },
  )

  process.once('SIGUSR2', stop)

  consola.ready(
    `listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  )
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
