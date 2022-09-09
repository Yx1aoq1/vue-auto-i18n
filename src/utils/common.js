export function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function getExtname(path) {
  const filenameWithoutSuffix = path.split(/#|\?/)[0]
  return (/[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0]
}

export function getFilenameWithoutExt(path) {
  const files = path.split(/\/|\\/)
  const filename = files.length ? files[files.length - 1] : ''
  return filename.split('.')[0]
}

/**
 * 是否含有中文（也包含日文和韩文）
 * @param {*} str
 */
export function isChineseChar(str) {
  var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/
  return reg.test(str)
}

/**
 * 对象扁平化处理
 * @param {*} obj
 * @param {*} key
 * @param {*} res
 * @param {*} isArray
 */
export function flatten(obj, key = '', res = {}, isArray = false) {
  for (let [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      let tmp = isArray ? key + '[' + k + ']' : key + k
      flatten(v, tmp, res, true)
    } else if (typeof v === 'object') {
      let tmp = isArray ? key + '[' + k + '].' : key + k + '.'
      flatten(v, tmp, res)
    } else {
      let tmp = isArray ? key + '[' + k + ']' : key + k
      res[tmp] = v
    }
  }
  return res
}

/**
 * 扁平化恢复
 * @param {*} data
 */
export function unflatten(data) {
  if (!isObject(data) || Array.isArray(data)) return data
  const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g
  const resultholder = {}
  for (const p in data) {
    let cur = resultholder
    let prop = ''
    let m
    while ((m = regex.exec(p))) {
      cur = cur[prop] || (cur[prop] = m[2] ? [] : {})
      prop = m[2] || m[1]
    }
    cur[prop] = data[p]
  }
  return resultholder[''] || resultholder
}

/**
 * 随机字符串
 */
export function getRandomStr() {
  return Math.random().toString(36).slice(2)
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
export function makeMap(str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val]
}

export function once(fn, context) {
  var result
  return function () {
    if (fn) {
      result = fn.apply(context || this, arguments)
      fn = null
    }
    return result
  }
}

/**
 * 将文本start-end处的文本替换为replace
 * @param {*} soure
 * @param {*} start
 * @param {*} end
 * @param {*} replace
 * @returns
 */
export function splice(soure, start, end, replace) {
  return soure.slice(0, start) + replace + soure.slice(end)
}

/**
 * 代码替换
 * @param {*} origin
 * @param {*} tokens
 * @param {*} callback
 * @returns
 */
export function codeReplace(origin, tokens, callback) {
  let code = origin
  let offset = 0
  tokens.forEach(token => {
    code = splice(code, token.start + offset, token.end + offset, callback(token))
    offset = code.length - origin.length
    // console.log('code', code)
  })
  return code
}
