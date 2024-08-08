import N3 from 'n3'
import { Transform }  from 'stream'

function error(msg, code=1) {
  console.error(`${msg}`)
  process.exit(code)
}

export const formats = {
  json: 'application/ld+json',
  jsonld: 'application/ld+json',
  'json-ld': 'application/ld+json',
  n3: 'text/n3',
  nq: 'application/n-quads',
  nt: 'application/n-triples',
  owl: 'application/rdf+xml',
  rdf: 'application/rdf+xml',
  trig: 'application/trig',
  ttl: 'text/turtle',
  turtle: 'text/turtle',
  xml: 'application/rdf+xml',
}


class RDFFilter extends Transform {
  constructor(filter) {
    super({
      objectMode: true,
      transform(quad, _, callback) {
        var result = filter(quad)
        if (result === true) {
          this.push(quad)       // keep
        } else if (result instanceof N3.Quad) {
          this.push(result)     // replace        
        } else if (Array.isArray(result)) {
          for (let q of result) this.push(q)
        }
        callback(null)
      }
    })
  }
}    


// TODO: try https://www.npmjs.com/package/async-transforms for parallel?

export function rdffilter(input, output, { from, to, filter }) {
  const parser = new N3.StreamParser({ format: from })

  // TODO: prefixes for nice output?
  const writer = new N3.StreamWriter({ format: to })

  filter = new RDFFilter(filter ?? (() => true))

  // TODO: pass errors to caller
  parser.on('error', error)

  input.pipe(parser)
    .pipe(filter)
    .pipe(writer)
    .pipe(output)
}
