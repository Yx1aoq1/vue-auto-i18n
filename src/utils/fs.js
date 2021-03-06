import fs from 'fs'
import os from 'os'
import path from 'path'
import dayjs from 'dayjs'

/**
 * 创建文件目录，确保文件目录存在
 * @param {*} filePath 
 */
export function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

/**
 * 读取ES6 export default js 文件
 * @param {*} filePath 
 */
export function readESModuleFile (filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const tempPath = path.join(os.tmpdir(), `./temp${dayjs().valueOf()}.js`)
  // 由于运行时不允许es6语法，只能替换一下再重新读取
  fs.writeFileSync(tempPath, content.replace('export default', 'exports.default ='), { flag: 'w' })
  const obj = require(tempPath).default
  // 删除文件
  fs.unlinkSync(tempPath)
  return obj
}

/**
 * 判断当前目录是否是文件夹
 * @param {*} filepath 
 */
export function isDirectory (filepath) {
  return fs.statSync(filepath).isDirectory()
}

/**
 * 导出文件到指定位置
 * @param {*} filepath 
 * @param {*} buffer 
 * @param {*} options 
 */
export function exportFile (filepath, buffer, options) {
  // 确保目录存在
  ensureDirectoryExistence(filepath)
  return fs.writeFileSync(filepath, buffer, options)
}

/**
 * 遍历文件夹
 */
export function travelDir (src, callback) {
  fs.readdirSync(src).forEach(filename => {
    // 判断是否为文件夹
    const filepath = path.join(src, filename)
    if (isDirectory(filepath)) {
      travelDir(filepath, callback)
    } else {
      callback(filepath)
    }
  })
}

export function exportLocale (filepath, obj, type = 'js') {
  let content = JSON.stringify(obj, null, 2)
  switch (type) {
    case 'json':
      return exportFile(filepath + '.json', content, { flag: 'w' })
    case 'js':
      content = `export default ${content}`
      content = content.replace(/\"([\w_-]*)\":/g, '$1:').replace(/:\s*\"(.*)\"/g, ': \'$1\'')
      return exportFile(filepath + '.js', content, { flag: 'w' })
  }
}