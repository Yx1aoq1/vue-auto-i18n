export class Scanner {
  constructor(templateStr) {
    this.templateStr = templateStr
    this.pos = 0
    this.tail = templateStr
    this.keyword = null
  }

  scan() {
    if (this.tail.indexOf(this.keyword) === 0) {
      this.pos += this.keyword.length
      this.tail = this.templateStr.substring(this.pos)
    }
  }

  scanUtil(stopTag) {
    if (Array.isArray(stopTag) && stopTag.length) {
      this.keyword = this.findNearestKeyword(stopTag)
      return this.scanUtil(this.keyword)
    }
    this.keyword = stopTag
    const pos_backup = this.pos
    while (!this.eos() && this.tail.indexOf(stopTag) !== 0) {
      this.pos++
      this.tail = this.templateStr.substring(this.pos)
    }

    return this.templateStr.substring(pos_backup, this.pos)
  }

  eos() {
    return this.pos >= this.templateStr.length
  }

  findKeywordPos(keyword) {
    return this.tail.indexOf(keyword)
  }

  findNearestKeyword(keys = []) {
    if (!keys.length) return null
    let nearest
    let min = Infinity
    keys.forEach((keyword) => {
      const pos = this.findKeywordPos(keyword)
      if (pos !== -1 && pos < min) {
        min = pos
        nearest = keyword
      }
    })
    return nearest
  }
}
