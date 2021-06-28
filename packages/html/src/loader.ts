import fs from 'fs'
import path from 'path'

import cheerio, { CheerioAPI } from 'cheerio'
import { OnLoadArgs } from 'esbuild'

import { EntryPoint, HtmlLoaderOptions, Loader } from './types'

const { readFile } = fs.promises

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#JavaScript_types
const VALID_SCRIPT_TYPE = new Set([
  'application/javascript',
  'application/ecmascript',
  'text/javascript',
  'text/ecmascript',
])

export class HtmlLoader implements Loader {
  constructor(private readonly options: HtmlLoaderOptions) {}

  loadScripts(basePath: string, $: CheerioAPI): EntryPoint[] {
    return $('script')
      .get()
      .reduce<EntryPoint[]>((entryPoints, el) => {
        const $el = $(el)
        const type = $el.attr('type')
        const src = $el.attr('src')

        if (
          (!src && !$el.html()?.trim()) ||
          (type && !VALID_SCRIPT_TYPE.has(type))
        ) {
          return entryPoints
        }

        entryPoints.push({
          options: src
            ? {
                entryPoints: [path.resolve(basePath, src)],
              }
            : {
                entryPoints: undefined,
                stdin: {
                  contents: $el.html()!,
                  resolveDir: basePath,
                  loader: 'tsx',
                },
              },
          onBuilt(outputFilePath) {
            $(el).html('').attr('src', outputFilePath)
          },
        })

        return entryPoints
      }, [])
  }

  onServeLoad(content: string) {
    return `data:text/javascript;base64,${Buffer.from(content).toString(
      'base64',
    )}`
  }

  async onLoad({ path: filePath }: OnLoadArgs) {
    const basePath = path.dirname(filePath)
    const contents = await readFile(filePath, 'utf8')

    const $ = cheerio.load(contents)

    const entryPoints = this.loadScripts(basePath, $)

    const { entryNames, esbuild, initialOptions, serve } = this.options

    const outdir =
      initialOptions.outdir ||
      (initialOptions.outfile && path.basename(initialOptions.outfile))

    await Promise.all(
      entryPoints.map(async ({ options, onBuilt }) => {
        const { metafile, outputFiles } = await esbuild!.build({
          ...initialOptions,
          ...options,
          entryNames: entryNames || '[name].[hash]',
          outdir,
          bundle: true,
          metafile: true,
          write: !serve,
        })

        if (!metafile) {
          return
        }

        if (serve) {
          console.log(outputFiles)
          onBuilt(this.onServeLoad(outputFiles![0].text))
        } else {
          const outputEntries = Object.entries(metafile.outputs)
          const [outputFilePath] =
            (options.entryPoints &&
              outputEntries.find(([_, { entryPoint }]) =>
                options.entryPoints.includes(path.resolve(entryPoint!)),
              )) ||
            outputEntries[0]
          onBuilt(
            outdir
              ? outputFilePath.replace(
                  new RegExp(`^${outdir}\\${path.sep}`),
                  '',
                )
              : outputFilePath,
          )
        }
      }),
    )

    return {
      contents: $.html(),
      loader: 'file' as const,
    }
  }
}
