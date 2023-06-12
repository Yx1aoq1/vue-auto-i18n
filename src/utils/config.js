import path from 'path'
import fs from 'fs'

// 配置文件名称
const CONFIG_FILE_NAME = 'i18n.config.js'
const cwd = process.cwd()

function getConfigFile(file) {
  return fs.existsSync(path.join(cwd, file)) ? path.join(cwd, file) : false
}

/**
 * 获取用户配置文件
 */
export default function getConfig() {
  let cfg = {}
  const configPath = getConfigFile(CONFIG_FILE_NAME)
  if (configPath) {
    delete require.cache[require.resolve(configPath)]
    cfg = require(configPath)
  } else {
    logger.error(`配置文件不存在，请在项目根目录下新增${CONFIG_FILE_NAME}文件！`)
    process.exit(1)
  }

  return cfg
}
