import { isObject } from 'lodash'
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
