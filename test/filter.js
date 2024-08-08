import { assert } from "chai"
import fs from "fs"
import { rdffilter, formats } from '../rdffilter.js'
import { PassThrough, Writable } from "stream"
import { BlankNode } from "n3"

function testResult(input, filter, expect, done) {
  const chunks = []
  const output = new Writable({
    write(chunk, _, callback) {
      chunks.push(chunk.toString())
      callback()
    }
  })

  rdffilter(input, output, { filter })
    .on('finish', () => {
      assert.equal(chunks.join(""), expect);
      done()
    })
}


describe("rdffilter", () => {
  it("should process RDF", done => {
    const input = fs.createReadStream("./test/example.ttl")
    const filter = ({ subject }) => subject instanceof BlankNode
    const expect = "_:b0_blank a <http://example.org/foo>.\n" 

    testResult(input, filter, expect, done)
  })
})
