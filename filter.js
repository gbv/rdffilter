import { NamedNode, BlankNode } from 'n3'

function notRelative(node) {
  return (node instanceof NamedNode ? absoluteIRI(node.id) : true)
}

function absoluteIRI(iri) {
  return /^(?:[a-z+]+:)/i.test(iri)
}

export default ({subject, predicate, object}) => {
//  return !(predicate instanceof BlankNode)
  return notRelative(subject) && notRelative(predicate) && notRelative(object)
}
