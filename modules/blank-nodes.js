// Filter out statements with blank nodes
export default ({subject, object}) => {
  return subject.termType != "BlankNode" && object.termType != "BlankNode"
}
