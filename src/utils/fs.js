import fs from 'fs'
import path from 'path'

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
 * 判断当前目录是否是文件夹
 * @param {*} filepath
 */
export function isDirectory(filepath) {
  return fs.statSync(filepath).isDirectory()
}

/**
 * 导出文件到指定位置
 * @param {*} filepath
 * @param {*} buffer
 * @param {*} options
 */
export function exportFile(filepath, buffer, options) {
  // 确保目录存在
  ensureDirectoryExistence(filepath)
  return fs.writeFileSync(filepath, buffer, options)
}

/**
 * 遍历文件夹
 */
export function travelDir(src, callback) {
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
