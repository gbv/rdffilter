import { DataFactory } from "n3"

const tripleElements = new Set(["subject","predicate","object"]) 
const elementNames = ["subject","predicate","object","graph"]

export class IRIFilter {
  constructor(opts={}) {
    this.range = Array.isArray(opts.range) ? new Set(opts.range) : (opts.range || tripleElements)
    this.action = opts.action
    // TODO: condition (equal, prefix, pattern) + value
    // TODO: result (null | replace string)
  }

  filterTerm(term) {
    return term.termType == "NamedNode" ? this.filterIRI(term.value) : true
  }

  filterIRI(iri) {
    return this.action ? this.action(iri) : true
  }

  filterQuad(quad) {
    const elements = [quad.subject, quad.predicate, quad.object, quad.graph]
    
    var changed = false
    for (let i=0; i<4; i++) {
      const name = elementNames[i]
      if (this.range.has(name)) {
        const term = this.filterTerm(elements[i])
        if (term !== true) {
          if (term) { // TODO: allow array
            changed = true
            elements[i] = term
          } else {
            return // drop quad
          }
        }
      }
    }

    return changed ? DataFactory.quad(...elements) : true
  }
}

export function iriFilter(opts={}) {
  const filter = new IRIFilter(opts)
  return quad => filter.filterQuad(quad)
}
