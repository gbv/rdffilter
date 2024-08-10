import N3 from "n3"
import { Transform }  from "stream"

function error(msg, code=1) {
  console.error(`${msg}`)
  process.exit(code)
}

export const formats = {
  n3: "text/n3",
  nq: "application/n-quads",
  nt: "N-Triples",
  trig: "application/trig",
  ttl: "text/turtle",
  turtle: "text/turtle",
}

class RDFFilter extends Transform {
  constructor(filter, options={}) {
    super({
      objectMode: true,
      transform(quad, _, callback) {        
        this.stats.quads++
          
        var result = filter(quad)
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
      },
    })

    this.stats = { quads: 0, kept: 0, removed: 0, added: 0 }
    this.pass = {
      added: options.added ?? true,
      kept: options.kept ?? true,
      removed: options.removed ?? false,
    }
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
      this.push(quad)
      this.stats.added++
    }
  }
}    


// TODO: try https://www.npmjs.com/package/async-transforms for parallel?

export function rdffilter(input, output, options = {}) {
  if (!("kept" in options)) {options.kept = true}
  if (!("added" in options)) {options.added = true}
  if (!("removed" in options)) {options.removed = false}

  var { from, to, filter, stats, ...filterOptions } = options

  var format = from ? formats[from] : "turtle" 
  const parser = new N3.StreamParser({ format })

  // TODO: prefixes for nice output?
  // TODO: make sure output is valid, see https://github.com/rdfjs/N3.js/issues/383#issuecomment-2282261922
  format = to ? formats[to] : "N-Triples" 
  const writer = new N3.StreamWriter({ format })

  filter = new RDFFilter(filter ?? (() => true), filterOptions)

  // TODO: pass errors to caller
  parser.on("error", error)

  writer.on("finish", () => {
    if (stats) {
      console.log(JSON.stringify(filter.stats))
    }
  })

  return input.pipe(parser)
    .pipe(filter)
    .pipe(writer)
    .pipe(output)

}
