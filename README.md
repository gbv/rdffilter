# rdffilter

Parse and filter RDF data for cleanup and expansion

The script ensures that RDF is syntactically valid and can be used to filter out, rewrite or expand individual triples.

## Usage

~~~
Usage: rdffilter [options] [input]

Arguments:
  input                RDF input file (default: - for stdin)

Options:
  -f, --from <format>  input RDF format (default from file name or turtle)
  -t, --to <format>    output RDF format (default from file name or nt)
  -o, --output <file>  RDF output file (default: "-")
  -m, --module <file>  filter module .js file
  -h, --help           display help for command
~~~

Examples of filter modules:

~~~js
// filter out statements with blank nodes
import { BlankNode } from 'n3'

export default ({subject, predicate, object}) => {
  return !(subject instanceof BlankNode) && !(object instanceof BlankNode)
}
~~~

~~~js
// filter out statements with relative IRIs
import { NamedNode } from 'n3'

const notRelative = node => (node instanceof NamedNode ? absoluteIRI(node.id) : true
const absoluteIRI = iri => /^(?:[a-z+]+:)/i.test(iri)

export default ({subject, predicate, object}) => {
  return notRelative(subject) && notRelative(predicate) && notRelative(object)
}
~~~
