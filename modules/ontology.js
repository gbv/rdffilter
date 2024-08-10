// Select Triples with ontology property rdf:type or rdfs:* or owl:*
const rdftype = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
const rdfs = new RegExp("^http://www\\.w3\\.org/2000/01/rdf-schema#(range|domain|subClassOf|subPropertyOf)$")
const owl = iri => iri.startsWith("http://www.w3.org/2002/07/owl#")

export default ({ predicate }) => {
  const p = predicate.value
  return p === rdftype || rdfs.test(p) || owl(p)
}
