import * as chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const { assert } = chai

import fs from "fs"
import { rdffilter } from "../index.js"
import { iriFilter, dataFactory as RDF } from "../index.js"
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

    assert.becomes(testResult("./test/example.ttl", { filter }), expect)
  })

  it("dct", async () => {
    const expect = `<> a <http://example.org/root>.
<http://example.org/a> a <http://example.org/b>.
_:b1_blank <http://purl.org/dc/xxx> "test".
`
    // TODO: test STDOUT is `{"quads":3,"removed":1,"added":1}`
    const opts =  { to: "turtle", filter: dctFilter, stats: true }
    assert.becomes(testResult("./test/example.ttl",opts), expect)
  })
})

describe("filterPipeline", () => {
  it("multiple filters", async () => {
    const expect = "_:b2_blank <http://purl.org/dc/elements/1.1/xxx> _:b2_blank .\n"
    var filter = [
      (q => q.subject.termType == "BlankNode"),
      ({subject, predicate}) => RDF.quad(subject, predicate, subject),
    ]
    assert.becomes(testResult("./test/example.ttl", { filter }), expect)
  })  
})

describe("IRIFilter", () => {
  const tests = {
    "<x:a> <x:b> <x:c> .\n": {},
    "<x:a1> <x:b1> <x:c1> .\n": { action: iri => RDF.namedNode(iri+1) },
    "<x:a> <x:b1> <x:c> .\n": { action: iri => RDF.namedNode(iri+1), range: ["predicate"] },
    "": { action: () => false },
  }

  for (let expect in tests) {
    it(expect.replace(/\n/,""), async () => {
      const filter = iriFilter(tests[expect])
      assert.becomes(testResult("./test/abc.ttl", { filter }), expect)
    })
  }
})
