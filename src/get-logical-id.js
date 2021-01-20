let { sep, join } = require('path')
let { existsSync } = require('fs')
let { getLambdaName, toLogicalID } = require('@architect/utils')

module.exports = function getLogicalID (inventory, dir) {
  let pathToCode = dir.endsWith(sep) ? dir.substr(0, dir.length - 1) : dir
  pathToCode = pathToCode.replace(process.cwd(), '').replace(/^\.?\/?\\?/, '')

  let { inv } = inventory
  let dirs = inv.lambdaSrcDirs
  if (!dirs.some(d => d.endsWith(pathToCode))) throw ReferenceError(`Unable to find Lambda for ${pathToCode}`)

  let lambda
  let lambdae = {
    events: 'Event',
    http: 'HTTP',
    macros: 'Macro',
    queues: 'Queue',
    scheduled: 'Scheduled',
    streams: 'Stream',
    ws: 'WS',
  }
  Object.entries(lambdae).forEach(([ pragma, type ]) => {
    if (lambda) return
    if (inv[pragma]) {
      let ls = []
      if (pragma === 'macros') {
        inv[pragma].forEach(macro => {
          let macroPath = null
          let localPath = join(process.cwd(), 'src', 'macros', `${macro}.js`)
          let localPath1 = join(process.cwd(), 'src', 'macros', macro)
          let modulePath = join(process.cwd(), 'node_modules', macro)
          let modulePath1 = join(process.cwd(), 'node_modules', `@${macro}`)
          if (existsSync(localPath)) macroPath = localPath
          else if (existsSync(localPath1)) macroPath = localPath1
          else if (existsSync(modulePath)) macroPath = modulePath
          else if (existsSync(modulePath1)) macroPath = modulePath1
          // eslint-disable-next-line
          let macroModule = require(macroPath)
          if (macroModule.create) {
            ls = ls.concat(macroModule.create(inventory))
          }
        })
      } else ls = inv[pragma]
      ls.forEach(l => {
        if (l.src.endsWith(pathToCode)) lambda = { ...l, type }
      })
    }
  })

  if (lambda) {
    let { name, type } = lambda
    if (type === 'HTTP') {
      let lambdaName = getLambdaName(lambda.path)
      let id = toLogicalID(`${lambda.method}${lambdaName.replace(/000/g, '')}`)
      return `${id}HTTPLambda`
    }
    else {
      let lambdaName = getLambdaName(name)
      let id = toLogicalID(lambdaName)
      return `${id}${type}Lambda`
    }
  }
}
