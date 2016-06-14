import * as FS from 'fs'
import * as PATH from 'path'
import * as mkdirp from 'mkdirp'

export function exists(filePath: string): FS.Stats {
  try {
    return FS.lstatSync(filePath)
  } catch (e) {
    return undefined
  }
}

export function writeFileSync(filePath, contents) {
  mkdirp.sync(PATH.dirname(filePath))
  FS.writeFileSync(filePath, contents)
}

export function groupOperationsByGroupName(operations) {
  return operations.reduce((groups, op) => {
    if (!groups[op.group]) groups[op.group] = []
    groups[op.group].push(op)
    return groups
  }, {})
}

export function join(parent: string[], child: string[]): string[] {
  parent.push.apply(parent, child)
  return parent
}

export function camelToUppercase(value: string): string {
  return value.replace(/([A-Z]+)/g, '_$1').toUpperCase()
}

export function getBestResponse(op: ApiOperation): ApiOperationResponse {
  const NOT_FOUND = 100000
  const lowestCode = op.responses.reduce((code, resp) => {
    const responseCode = parseInt(resp.code)
    if (isNaN(responseCode) || responseCode >= code) return code
    else return responseCode
  }, NOT_FOUND)
  
  return (lowestCode === NOT_FOUND) 
    ? op.responses[0]
    : op.responses.find(resp => resp.code == `${lowestCode}`)
}

export function removeOldFiles(options: ClientOptions) {
  cleanDirs(options.outDir, options)
}

function cleanDirs(dir: string, options: ClientOptions) {
  dir = PATH.resolve(dir)
  const stats = exists(dir)
  if (!stats || !stats.isDirectory()) return

  const files = FS.readdirSync(dir).map(file => PATH.resolve(`${dir}/${file}`))
  while (files.length) {
    const file = files.pop()
    if (file.endsWith(options.language) && !file.endsWith(`index.${options.language}`)) {
      FS.unlinkSync(file)
    } else if (exists(file).isDirectory()) {
      cleanDirs(file, options)
    }
  }
}