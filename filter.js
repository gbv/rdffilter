import { NamedNode } from 'n3'

function notRelative(node) {
  return (node instanceof NamedNode ? absoluteIRI(node.id) : true)
}

function absoluteIRI(iri) {
  return /^(?:[a-z+]+:)/i.test(iri)
}

export default quad => {
  return notRelative(quad._subject) && notRelative(quad._predicate) && notRelative(quad._object)
}
