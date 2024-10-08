# rdffilter

> Parse and filter RDF data for cleanup and expansion

[![Test](https://github.com/gbv/rdffilter/actions/workflows/test.yml/badge.svg)](https://github.com/gbv/rdffilter/actions/workflows/test.yml)
[![NPM Version](http://img.shields.io/npm/v/rdffilter.svg?style=flat)](https://www.npmjs.org/package/rdffilter)

The package and its command line script ensures that RDF is syntactically valid and can be used to filter out, rewrite or expand individual triples.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Filters](#filters)
  - [rdffilter](#rdffilter)
  - [filterQuad](#filterquad)
  - [filterPipeline](#filterpipleine)
  - [iriFilter](#irifilter)
  - [namespaceFilter](#namespacefilter)
  - [dataFactory](#datafactory)
- [See Also](#see-also)
- [License](#license)

## Background

> The [Semantic] Web works though anyone being (technically) allowed to say anything about anything.

— Tim Berners-Lee ([1998](https://www.w3.org/DesignIssues/RDFnot.html))

The best part of RDF, next to IRIs, is triples can always be combined. The worst part of RDF, next to blank nodes, is triples can always be combined. In practice you better exclude some kinds of triples. 

Despite the availability of complicated technologies to ensure data quality, such as [Web Ontology Language (OWL)](https://www.w3.org/TR/owl2-overview/) and [Shapes Constraint Language (SHACL)](https://www.w3.org/TR/shacl/), people keep creating malformed, invalid, faulty or nonsensical RDF data in good faith. Contrary to popular belief, RDF data is not more "semantic" than scribbled shopping lists, Excel sheets, or any other kind of data -- unless the data follows some assumptions. This tool can help to check some of these assumptions and to modify RDF data to better meet defined expections.

Cavehat: this tool processes RDF data one triple or quad each, so only simple
kinds of patterns can be detected and processed. Please use an RDF inference
engine or validation processor for more complex rules!

## Install

Either install globally (requires root or best [a Node version manager such as nvm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)):

~~~sh
npm i -g rdffilter
~~~

Or install locally in your project folder:

~~~
npm i rdffilter
~~~

## Usage

By default the command line client reads RDF Turtle syntax and writes
N-Triples. With option `--quads` or if input file extension is `.nq` or
`.trig`, the formats are changed to TriG and N-Quads, respectively. The output
format can also be set explicitly with option `--to` for Turtle
(`ttl`/`turtle`), N-Triples (`nt`), N-Quads (`nq`) or TriG (`trig`). RDF
extension RDF-star is not supported.

To enable triple filtering use option `-f` to specify [filters](#filters).

~~~
Usage: rdffilter [options] [input]

Arguments:
  input                RDF input file (default: - for stdin)

Options:
  -f, --filter <name>  filter module name or local .js/.mjs file
  -t, --to <format>    output RDF format (default from file name or nt)
  -o, --output <file>  RDF output file (default: "-")
  -q, --quads          expect quads (read TriG, write N-Quads)
  -l, --list           list module names and quit
  -k, --kept           emit kept quads
  -a, --added          emit added quads
  -r, --removed        emit removed quads
  -s, --stats          print statistics at the end
  -h, --help           display help for command
~~~

If none of option `-k`, `-a`, `-r` is given, the combination `-k -a` is used as default (emit kept and added quads).

## API

This node package can also be used as programming library but the API has not been fixed yet. Please consult the source code.

The following functions can be exported:

### rdffilter

Filter RDF triples. Exact calling syntax is not fixed yet.

### filterQuad

Apply a filter function to an RDF quad/triple and always return a (possibly empty) array of quad/triple objects or `true` values. To transform the result into an array of quad/triple objects use this:

~~~js
const quads = filterQuad(filter, quad).map(q => q === true ? quad : q)
~~~

### filterPipeline

Create a filter function from a list of filters. The result of first filter is passed to the second and so on.

### iriFilter

Returns a filter function that checks IRIs in quads or triples with an `action` method each. The method either returns a modified IRI or a boolean value whether to keep the term. Option `range` can be set to an array of which terms to check (`["subject","predicate","object"]` by default).

To give an example, the following filter only keeps statements with `rdf:type` predicate.

~~~js
iriFilter({
  range: ["predicate"],
  action: iri => iri === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
})
~~~

### namespaceFilter

Returns an iriFilter that compares IRIs against a map of IRI namespaces.

~~~js
namespaceFilter({
  range: ["subject","predicate"],
  namespaces: {
    "http://purl.org/dc/elements/1.1/": "http://purl.org/dc/terms/", // rewrite
    "http://example": true, // keep
    "": false // remove everything else (by default everything else is kept)
  }
})
~~~

### dataFactory

Implements the [RDF/JS DataFactory interface](https://rdf.js.org/data-model-spec/#datafactory-interface) to create RDF Terms:

~~~js
import { dataFactory as RDF } from "rdffilter"

const triple = RDF.triple(
  RDF.blankNode(),
  RDF.namedNode("http://www.w3.org/2000/01/rdf-schema#label"),
  RDF.literal("Hello, World!", "en")
)
~~~


## Filters

A filter module is a JavaScript file that exports a filter function. The function gets an RDF Triple or Quad object that implements the [RDF/JS Quad Interface](https://rdf.js.org/data-model-spec/#quad-interface). The following example module filters out statements with blank nodes:

~~~js
export default ({subject, predicate, object}) => {
  return subject.termType != "BlankNode" && object.termType != "BlankNode"
}
~~~

Filter modules can either be referenced by filename or by name of a file in the [modules directory](modules) of this package. Please have a look at the latter for examples of filter modules. A filter function can return:

- `true` to keep the triple

- an object or an array of objects to replace the triple.  To add triples *in
  addition to* the original triple, return an array with the original triple *as
  first element* (otherwise the original triple will not be counted as kept but as
  removed and added).

- any falsy value (`false`, `undefined`, `null`) to filter out the triple

Returned objects are expected to conform to RDF/JS Quad Interface. This package uses [N3](https://www.npmjs.com/package/n3) so you can use its factory methods. A slightly more complex example below:

~~~js
// Replace Dublin Core Element Set predicate URIs with DC Terms URIs
import { dataFactory as RDF } from "rdffilter"

export default ({ subject, predicate, object }) => {
  if (predicate.termType === "NamedNode" && predicate.value.startsWith("http://purl.org/dc/elements/1.1/")) {
    const uri = predicate.value.replace("http://purl.org/dc/elements/1.1/","http://purl.org/dc/")
    return RDF.quad(subject, RDF.namedNode(uri), object)
  }
  return true
}
~~~


## See Also

This tool does not check for duplicated triples. Duplicated triples are irrelevant *in theory* but problematic *in practice* because you likely end up with wrong triple counts. The best way to remove duplicate triples is to process NTriples with standard command line tools:

~~~sh
rdffilter ... | sort | uniq
~~~

To convert between RDF serializations and to check whether RDF is syntactically valid you might better use the [rapper](https://librdf.org/raptor/rapper.html) utility which is likely faster.

## License

Licensed under the MIT License.

