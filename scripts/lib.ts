import fs from 'fs'
import path from 'path'

import { build, BuildOptions } from 'esbuild'

const PKG_PATH = path.resolve(__dirname, '../packages')

const { readdir, stat } = fs.promises

const main = async () => {
  const pkgs = await readdir(PKG_PATH)
  const pkgNames: string[] = []
  const pkgPaths: string[] = []
  const entryPoints: string[] = []
  for (const pkg of pkgs) {
    const entries = ['src/index.ts', 'index.ts']
    for (const entry of entries) {
      try {
        const pkgPath = path.resolve(PKG_PATH, pkg)
        const file = path.resolve(pkgPath, entry)
        const stats = await stat(file)
        if (stats.isFile()) {
          pkgNames.push(pkg)
          pkgPaths.push(pkgPath)
          entryPoints.push(file)
        }
      } catch {
        continue
      }
    }
  }

  await Promise.all(
    entryPoints.flatMap((entryPoint, index) => {
      const pkgPath = pkgPaths[index]
      const {
        main,
        module,
        peerDependencies = {},
        dependencies = {},
      } = JSON.parse(fs.readFileSync(`${pkgPath}/package.json`, 'utf8')) as {
        main: string
        module: string
        peerDependencies?: Record<string, string>
        dependencies?: Record<string, string>
      }

      const commonBuildOptions: BuildOptions = {
        entryPoints: [entryPoint],
        bundle: true,
        platform: 'node',
        target: 'es6',
        sourcemap: true,
        external: [
          ...Object.keys(peerDependencies),
          ...Object.keys(dependencies),
        ],
      }

      return [
        build({
          ...commonBuildOptions,
          format: 'cjs',
          outfile: path.resolve(pkgPath, main || `lib/${pkgNames[index]}.cjs`),
        }),
        build({
          ...commonBuildOptions,
          format: 'esm',
          outfile: path.resolve(
            pkgPath,
            module || `lib/${pkgNames[index]}.mjs`,
          ),
        }),
      ]
    }),
  )
}

main().catch(console.error)
