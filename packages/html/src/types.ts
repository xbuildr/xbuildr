import {
  BuildOptions,
  OnLoadArgs,
  OnLoadResult,
  Loader as EsBuildLoader,
  StdinOptions,
} from 'esbuild'

export interface HtmlPluginOptions {
  esbuild?: typeof import('esbuild')
  serve?: boolean
  /**
   * override the root level option
   * @default '[name].[hash]'
   */
  entryNames?: string
  /**
   * override the root level option
   * @default '[name].[hash]'
   */
  assetNames?: string
}

export interface HtmlLoaderOptions extends HtmlPluginOptions {
  initialOptions: BuildOptions
}

export interface Loader {
  onLoad(args: OnLoadArgs): OnLoadResult | Promise<OnLoadResult>
}

export interface EntryPoint {
  options: BuildOptions &
    (
      | {
          entryPoints: string[]
          stdin?: never
        }
      | {
          entryPoints: undefined
          stdin: StdinOptions
        }
    )
  loader?: EsBuildLoader
  onBuilt(outputFilePath: string): void
}

export type ValueOfSet<T extends Set<unknown>> = T extends Set<infer R>
  ? R
  : never
