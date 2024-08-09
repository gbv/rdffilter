import { assert } from "chai"
import fs from "fs"
import { rdffilter } from "../rdffilter.js"
import { Writable } from "stream"
import { BlankNode } from "n3"

function testResult(inputFile, filter, expect, done) {
  const input = fs.createReadStream(inputFile)

  const chunks = []
  const output = new Writable({
    write(chunk, _, callback) {
      chunks.push(chunk.toString())
      callback()
    },
  })

  rdffilter(input, output, { filter })
    .on("finish", () => {
      assert.equal(chunks.join(""), expect)
      done()
    })
}


describe("rdffilter", () => {
  it("should process RDF", done => {
    const filter = ({ subject }) => subject instanceof BlankNode
    const expect = "_:b0_blank a <http://example.org/foo>.\n" 

    testResult("./test/example.ttl", filter, expect, done)
  })
})
