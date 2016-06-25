import { SP, ST } from './support'
import { readFileSync } from 'fs'
import { exists, writeFileSync } from '../util'

export default function genService(options: ClientOptions) {
  const file = genServiceFile(options)
  if (!exists(file.path)) {
    const contents = file.contents.replace(/  /g, SP).replace(/;;/g, ST)
    writeFileSync(file.path, contents)
  }
}

export function genServiceFile(options: ClientOptions) {
  const path = `${options.outDir}/gateway/index.${options.language}`
  const contents = readFileSync(`${__dirname}/service.${options.language}.template`, 'utf8')
  return  { path, contents }
}