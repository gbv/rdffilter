import N3 from "n3"
import { Transform }  from "stream"

function error(msg, code=1) {
  console.error(`${msg}`)
  process.exit(code)
}

export const formats = {
  json: "application/ld+json",
  jsonld: "application/ld+json",
  "json-ld": "application/ld+json",
  n3: "text/n3",
  nq: "application/n-quads",
  nt: "application/n-triples",
  owl: "application/rdf+xml",
  rdf: "application/rdf+xml",
  trig: "application/trig",
  ttl: "text/turtle",
  turtle: "text/turtle",
  xml: "application/rdf+xml",
}


class RDFFilter extends Transform {
  constructor(filter, options={}) {
    super({
      objectMode: true,
      transform(quad, _, callback) {
        if (this.stats) {this.stats.quads++}
        var result = filter(quad)
        if (result === true) {
          this.push(quad)
        } else if (Array.isArray(result)) {
          if (this.stats) {            
            if (quad.equals(result[0])) {
              this.stats.added += result.length - 1
            } else {
              this.stats.removed++
              this.stats.added += result.length
            }
          }
          for (let q of result) {
            this.push(q)
          }
        } else if (typeof result === "object") {
          if (this.stats) {
            if (!quad.equals(result[0])) {
              this.stats.removed++
              this.stats.added++
            }
          }
          this.push(result)
        } else if (this.stats) {
          this.stats.removed++
        }
        callback(null)
      },
    })
    this.stats = options.stats ? { quads: 0, removed: 0, added: 0 } : null
  }
}    


// TODO: try https://www.npmjs.com/package/async-transforms for parallel?

export function rdffilter(input, output, { from, to, filter, stats } = {}) {
  const parser = new N3.StreamParser({ format: from || "turtle" })

  // TODO: prefixes for nice output?
  const writer = new N3.StreamWriter({ format: to || "nt" })

  filter = new RDFFilter(filter ?? (() => true), { stats })

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
