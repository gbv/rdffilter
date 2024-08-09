// Replace Dublin Core Element Set predicate URIs with DC Terms URIs
import { Quad, NamedNode } from "n3"

export default ({ subject, predicate, object }) => {
  if (predicate.termType === "NamedNode" && predicate.value.startsWith("http://purl.org/dc/elements/1.1/")) {
    const uri = predicate.value.replace("http://purl.org/dc/elements/1.1/","http://purl.org/dc/")
    return new Quad(subject, new NamedNode(uri), object)
  }
  return true
}
