// filter out statements with relative IRIs
const notRelative = node => node.termType === "NamedNode" ? absoluteIRI(node.id) : true
const absoluteIRI = iri => /^(?:[a-z+]+:)/i.test(iri)

export default ({subject, predicate, object}) => {
  return notRelative(subject) && notRelative(predicate) && notRelative(object)
}
