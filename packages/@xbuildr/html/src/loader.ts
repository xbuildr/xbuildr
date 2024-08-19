import fs from 'node:fs'
import path from 'node:path'

import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { OnLoadArgs } from 'esbuild'

import { EntryPoint, HtmlLoaderOptions, Loader, ValueOfSet } from './types'

const { readFile } = fs.promises

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#JavaScript_types
export const VALID_SCRIPT_TYPES = new Set([
  'application/javascript',
  'application/ecmascript',
  'text/javascript',
  'text/ecmascript',
  'module',
])

export const VALID_LANGS = new Set(['js', 'jsx', 'ts', 'tsx'] as const)

export type ValidLang = ValueOfSet<typeof VALID_LANGS>

export const DEFAULT_NAMES = '[name].[hash]'

export class HtmlLoader implements Loader {
  constructor(private readonly options: HtmlLoaderOptions) {}

  loadScripts(basePath: string, $: CheerioAPI): EntryPoint[] {
    return $('script')
      .get()
      .reduce<EntryPoint[]>((entryPoints, el) => {
        const $el = $(el)

        const src = $el.attr('src')
        const type = $el.attr('type')
        const lang = $el.attr('lang')

        if (
          (!src && !$el.html()?.trim()) ||
          (type && !VALID_SCRIPT_TYPES.has(type)) ||
          (lang && !VALID_LANGS.has(lang as ValidLang))
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
                  loader: lang as ValidLang,
                },
              },
          onBuilt(outfile) {
            $(el).html('').attr('src', outfile)
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

    const { assetNames, entryNames, esbuild, initialOptions, serve } =
      this.options

    const outdir =
      initialOptions.outdir ||
      (initialOptions.outfile && path.basename(initialOptions.outfile)) ||
      ''

    const $ = cheerio.load(contents)

    const entryPoints = this.loadScripts(basePath, $)

    await Promise.all(
      entryPoints.map(async ({ options, onBuilt }) => {
        const { metafile, outputFiles } = await esbuild!.build({
          ...initialOptions,
          ...options,
          assetNames: assetNames || DEFAULT_NAMES,
          entryNames: entryNames || DEFAULT_NAMES,
          outdir,
          bundle: true,
          metafile: true,
          write: !serve,
        })

        if (serve) {
          onBuilt(
            this.onServeLoad(
              outputFiles!.find(({ path }) => !path.endsWith('.map'))!.text,
            ),
          )
        } else {
          const outputEntries = Object.entries(metafile.outputs).filter(
            ([outfile]) => !outfile.endsWith('.map'),
          )
          const [outfile] =
            (options.entryPoints &&
              outputEntries.find(([_, { entryPoint }]) =>
                options.entryPoints.includes(path.resolve(entryPoint!)),
              )) ||
            outputEntries[0]
          onBuilt(path.relative(outdir, outfile))
        }
      }),
    )

    return {
      contents: $.html(),
      loader: 'file' as const,
    }
  }
}
