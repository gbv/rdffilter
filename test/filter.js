import { assert } from "chai"
import fs from "fs"
import { rdffilter } from "../rdffilter.js"
import { Writable } from "stream"
import { BlankNode } from "n3"

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
    const expect = "_:b0_blank <http://purl.org/dc/elements/1.1/xxx> \"test\".\n" 

    testResult("./test/example.ttl", { filter }, expect, done)
  })

  it("dct", done => {
    const expect = `<> a <http://example.org/root>.
<http://example.org/a> a <http://example.org/b>.
_:b1_blank <http://purl.org/dc/xxx> "test".
`
    // TODO: test STDOUT is `{"quads":3,"removed":1,"added":1}`
    // TODO: test multiple filters
    testResult("./test/example.ttl", { filter: dctFilter, stats: true }, expect, done)
  })
})
