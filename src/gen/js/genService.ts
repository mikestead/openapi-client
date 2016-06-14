import { readFileSync } from 'fs'
import { exists, writeFileSync } from '../util'

export default function genService(options: ClientOptions) {
  const file = genServiceFile(options)
  if (!exists(file.path)) {
    writeFileSync(file.path, file.contents)
  }
}

export function genServiceFile(options: ClientOptions) {
  const path = `${options.outDir}/gateway/index.${options.language}`
  const contents = readFileSync(`${__dirname}/service.${options.language}.template`)
  return  { path, contents }
}