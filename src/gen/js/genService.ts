import { SP, ST } from './support'
import { readFileSync } from 'fs'
import { exists, writeFileSync } from '../util'

export default function genService(options: ClientOptions) {
  const file = genServiceFile(options)
  const contents = file.contents.replace(/  /g, SP).replace(/;;/g, ST)
  writeFileSync(file.path, contents)
}

export function genServiceFile(options: ClientOptions) {
  const path = `${options.outDir}/gateway/index.${options.language}`
  let contents = readFileSync(`${__dirname}/service.${options.language}.template`, 'utf8')

  // when isolated modules options is set and true, add a import statement
  // at the top of the service template
  if (options.isolatedModules && options.isolatedModules === true) {
    let lines = contents.split(/\r?\n/);
    lines.splice(3, 0, 'import * as api from \'../types\'');

    contents = "";
    lines.forEach((line => contents += `${line}\n`));
  }

  return  { path, contents }
}