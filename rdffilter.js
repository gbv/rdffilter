import N3 from "n3"
import { RDFFilterTransformer } from "./src/transformer.js"
import { filterPipeline } from "./src/blocks.js"

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

// TODO: try https://www.npmjs.com/package/async-transforms for parallel?

export function rdffilter(input, output, options = {}) {
  if (!("kept" in options)) {options.kept = true}
  if (!("added" in options)) {options.added = true}
  if (!("removed" in options)) {options.removed = false}

  var { from, to, filter, stats, ...filterOptions } = options

  var format = from ? formats[from] : "turtle" 
  const parser = new N3.StreamParser({ format })

  // TODO: Add prefixes for nice output?
  // TODO: make sure output is valid, see https://github.com/rdfjs/N3.js/issues/383#issuecomment-2282261922
  format = to ? formats[to] : "N-Triples" 
  const writer = new N3.StreamWriter({ format })

  var combinedFilter
  if (typeof filter == "function") {
    combinedFilter = filter
  } else if (filter.length == 0) { 
    combinedFilter = () => true
  } else if (filter.length == 1) {
    combinedFilter = filter[0]
  } else {
    combinedFilter = filterPipeline(filter)
  }
  const streamFilter = new RDFFilterTransformer(combinedFilter, filterOptions)

  // TODO: pass errors to caller
  parser.on("error", error)

  writer.on("finish", () => {
    if (stats) {
      console.log(JSON.stringify(streamFilter.stats))
    }
  })

  return input.pipe(parser)
    .pipe(streamFilter)
    .pipe(writer)
    .pipe(output)

}
