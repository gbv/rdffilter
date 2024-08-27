import { DataFactory } from "n3"

const tripleElements = new Set(["subject","predicate","object"]) 
const elementNames = ["subject","predicate","object","graph"]

export class IRIFilter extends Function {
  constructor(opts={}) {
    super()
    this.range = opts.range || tripleElements
    this.action = opts.action
    // TODO: condition (equal, prefix, pattern) + value
    // TODO: result (null | replace string)
  }

  filterTerm(term) {
    return term.termType == "NamedNode" ? this.filterResource(term) : null
  }

  filterResource(resource) {
    return this.action ? this.action(resource) : null
  }

  filterQuad(quad) {
    const elements = [quad.subject, quad.predicate, quad.object, quad.graph]
    
    var changed = false
    elementNames.forEach((name,i) => {
      if (this.range.has(name)) {
        const term = this.filterTerm(elements[i])
        if (term) { // TODO: allow array
          changed = true
          elements[i] = term
        }
      }
    })

    return changed ? DataFactory.quad(...elements) : true
  }

  call(...args) {
    return this.filterQuad.call(...args)
  }
}
