import type { Plugin } from 'esbuild'
import _esbuild from 'esbuild'

import { HtmlPluginOptions } from './types'
import { HtmlLoader } from './loader'

const namespace = '@esbuilder/html'

const html = ({
  esbuild = _esbuild,
  entryNames,
  serve,
}: HtmlPluginOptions = {}): Plugin => ({
  name: 'html',
  setup(build) {
    if (entryNames === '[name]') {
      console.error('`[name]` for `entryNames` can not work correctly for now')
    }

    const loader = new HtmlLoader({
      esbuild,
      entryNames,
      serve,
      initialOptions: build.initialOptions,
    })

    build.onResolve({ filter: /\.html$/ }, ({ path }) => ({
      namespace,
      path,
    }))

    build.onLoad(
      { filter: /\.html$/, namespace },
      HtmlLoader.prototype.onLoad.bind(loader),
    )
  },
})

export default html

export { html }
