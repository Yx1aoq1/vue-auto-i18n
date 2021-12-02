export function getExtname (path) {
  const filenameWithoutSuffix = path.split(/#|\?/)[0]
  return (/[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0]
}

export function getFilenameWithoutExt (path) {
  const files = path.split(/\/|\\/)
  const filename = files.length ? files[files.length - 1] : ''
  return filename.split('.')[0]
}

/**
 * 是否含有中文（也包含日文和韩文）
 * @param {*} str
 */
export function isChineseChar (str) {
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
export function flat (obj, key = '', res = {}, isArray = false) {
	for (let [ k, v ] of Object.entries(obj)) {
		if (Array.isArray(v)) {
			let tmp = isArray ? key + '[' + k + ']' : key + k
			flat(v, tmp, res, true)
		} else if (typeof v === 'object') {
			let tmp = isArray ? key + '[' + k + '].' : key + k + '.'
			flat(v, tmp, res)
		} else {
			let tmp = isArray ? key + '[' + k + ']' : key + k
			res[tmp] = v
		}
	}
	return res
}

/**
 * 随机字符串
 */
export function getRandomStr () {
	return Math.random().toString(36).slice(2)
}