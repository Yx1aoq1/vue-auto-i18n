import path from 'path'
import fs from 'fs'

const cwd = process.cwd()

function getConfigFile (file) {
  return fs.existsSync(path.join(cwd, file)) ? path.join(cwd, file) : false
}


export default function getConfig () {
  let syncConf = {}
  const configPath = getConfigFile(global.CONFIG_FILE_NAME)
  if (configPath) {
    syncConf = require(configPath)
  } else {
    process.exit(1)
  }

  return syncConf
}