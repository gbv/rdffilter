import { Transform }  from "stream"

export class RDFFilterTransformer extends Transform {
  constructor(filter, options={}) {
    super({ objectMode: true })
    this.filter = filter
    this.stats = { quads: 0, kept: 0, removed: 0, added: 0 }
    this.pass = {
      added: options.added ?? true,
      kept: options.kept ?? true,
      removed: options.removed ?? false,
    }
  }

  _transform(quad, _, callback) {        
    this.stats.quads++
          
    var result = this.filter(quad)
    if (result === true) {
      this.keep(quad)
    } else if (Array.isArray(result)) {
      if (!result.length) {
        this.remove(quad)
      } else {
        if (quad.equals(result[0])) {
          this.keep(quad)
          result.shift()
        }
        for (let q of result) {
          this.add(q)
        }
      }
    } else if (typeof result === "object") {
      if (quad.equals(result[0])) {
        this.keep(quad)
      } else {
        this.remove(quad)
        this.add(result)
      }
    } else {
      this.remove(quad)
    }
    callback(null)
  }

  keep(quad) {
    if (this.pass.kept) {
      this.push(quad)
      this.stats.kept++
    }
  }

  remove(quad) {
    if (this.pass.removed) {
      this.push(quad)
    } else {
      this.stats.removed++
    }
  }

  add(quad) {
    if (this.pass.added) {
      this.stats.added++
      this.push(quad)
    }
  }
}    


