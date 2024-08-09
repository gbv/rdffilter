// Select Triples with ontology property from RDFS or OWL
const rdfs = new RegExp('^http://www\.w3\.org/2000/01/rdf-schema#(type|range|domain|subClassOf|subPropertyOf)$')
const owl = iri => iri.startsWith("http://www.w3.org/2002/07/owl#")

export default ({ predicate }) => {
  return rdfs.test(predicate.value) || owl(predicate.value)
}
