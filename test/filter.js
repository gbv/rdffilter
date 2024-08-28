import { assert } from "chai"
import fs from "fs"
import { rdffilter } from "../index.js"
import { Writable } from "stream"
import { BlankNode } from "n3"
import { iriFilter, dataFactory as RDF } from "../index.js"

import dctFilter from "../modules/dct.js"

function testResult(inputFile, options, expect, done) {    
  const input = fs.createReadStream(inputFile)

  const chunks = []
  const output = new Writable({
    write(chunk, _, callback) {
      chunks.push(chunk.toString())
      callback()
    },
  })

  rdffilter(input, output, options)
    .on("finish", () => {
      assert.equal(chunks.join(""), expect)
      done()
    })
}


describe("rdffilter", () => {
  it("should process RDF", done => {
    const filter = ({ subject }) => subject instanceof BlankNode
    const expect = "_:b0_blank <http://purl.org/dc/elements/1.1/xxx> \"test\" .\n" 

    testResult("./test/example.ttl", { filter }, expect, done)
  })

  it("dct", done => {
    const expect = `<> a <http://example.org/root>.
<http://example.org/a> a <http://example.org/b>.
_:b1_blank <http://purl.org/dc/xxx> "test".
`
    // TODO: test STDOUT is `{"quads":3,"removed":1,"added":1}`
    testResult("./test/example.ttl", { to: "turtle", filter: dctFilter, stats: true }, expect, done)
  })
})

describe("filterPipeline", () => {
  it("multiple filters", done => {
    const expect = "_:b2_blank <http://purl.org/dc/elements/1.1/xxx> _:b2_blank .\n"
    var filter = [
      (q => q.subject.termType == "BlankNode"),
      ({subject, predicate}) => RDF.quad(subject, predicate, subject),
    ]
    testResult("./test/example.ttl", { filter }, expect, done)
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
    it(expect.replace(/\n/,""), done => {
      const filter = iriFilter(tests[expect])
      testResult("./test/abc.ttl", { filter }, expect, done)
    })
  }
})
