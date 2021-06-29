import { BuildOptions } from 'esbuild'

export const COMMON_BUILD_OPTIONS: BuildOptions = {
  bundle: true,
  entryPoints: ['src/index.html'],
  outdir: 'docs',
  sourcemap: true,
  assetNames: '[name]',
  define: {
    __VUE_OPTIONS_API__: JSON.stringify(true),
    __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
  },
}
