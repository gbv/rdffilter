import { assert } from "chai"

import fs from "fs"
import { rdffilter } from "../index.js"
import { iriFilter, namespaceFilter, dataFactory as RDF } from "../index.js"
import { text } from "node:stream/consumers"

import dctFilter from "../modules/dct.js"


async function testResult(inputFile, options) {    
  const input = fs.createReadStream(inputFile)
  return text(rdffilter(input, options))
}

describe("rdffilter", async () => {
  it("should process RDF", async () => {
    const filter = ({ subject }) => subject.termType === "BlankNode"
    const expect = "_:b0_blank <http://purl.org/dc/elements/1.1/xxx> \"test\" .\n" 

    const rdf = await testResult("./test/example.ttl", { filter })
    assert.equal(rdf, expect)
  })

  it("dct", async () => {
    const expect = `<> a <http://example.org/root>.
<http://example.org/a> a <http://example.org/b>.
_:b1_blank <http://purl.org/dc/xxx> "test".
`
    // TODO: test STDOUT is `{"quads":3,"removed":1,"added":1}`
    const opts =  { to: "turtle", filter: dctFilter, stats: true }
    const rdf = await testResult("./test/example.ttl",opts)
    assert.equal(rdf, expect)
  })
})

describe("filterPipeline", () => {
  it("multiple filters", async () => {
    const expect = "_:b2_blank <http://purl.org/dc/elements/1.1/xxx> _:b2_blank .\n"
    var filter = [
      (q => q.subject.termType == "BlankNode"),
      ({subject, predicate}) => RDF.quad(subject, predicate, subject),
    ]
    const rdf = await testResult("./test/example.ttl", { filter })
    assert.equal(rdf, expect)
  })  
})

describe("iriFilter", () => {
  const tests = {
    "<x:a> <x:b> <x:c> .\n": {},
    "<x:a1> <x:b1> <x:c1> .\n": { action: iri => iri+1 },
    "<x:a> <x:b1> <x:c> .\n": { action: iri => iri+1, range: ["predicate"] },
    "": { action: () => false },
  }
  for (let expect in tests) {
    it(expect.replace(/\n/,""), async () => {
      const filter = iriFilter(tests[expect])
      const rdf = await testResult("./test/abc.ttl", { filter })
      assert.equal(rdf, expect)
    })
  }
})

describe("namespaceFilter", () => {
  it("filters", async () => {
    const filter = namespaceFilter({
      range: ["predicate", "object"],
      namespaces: {
        "http://purl.org/dc/elements/1.1/": "http://purl.org/dc/terms/",
        "http://example.org/b": false,
        "http://example.org/": true,
      },
    })

    const expect = `<> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/root> .
_:b7_blank <http://purl.org/dc/terms/xxx> "test" .
`
    const rdf = await testResult("./test/example.ttl", { filter })
    assert.equal(rdf, expect)
  })
})


