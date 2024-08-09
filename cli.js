#!/usr/bin/env node

import fs from "fs"
import path from "path"

import { fileURLToPath } from "url"
const localFile = file => fileURLToPath(new URL(file, import.meta.url))
const pkg = await fs.readFileSync(localFile("package.json"))

import { program } from "commander"

import { rdffilter, formats } from "./rdffilter.js"

function error(msg, code=1) {
  console.error(`${msg}`)
  process.exit(code)
}

function getFormat(file, format, type) {
  format ||= file.split(".").slice(1)[0]
  if (format && !(format in formats)) {error(`${type} format ${format} not supported!`)}
  return format
}

async function loadModule(module) {
  return await import(path.resolve(module))
    .then(mod => module = mod.default) 
    .catch(e => {
      if (e.code =="ERR_MODULE_NOT_FOUND") {
        e = `Module not found: ${module}`
      } else if (e.stack) {       
        e = e.stack.split(/\n\s*/).slice(0,2).join(" ")
      } else {
        e = `Error in module ${module}: ${e.message}`
      }
      error(e)
    })
}

async function filterFromModule(module) {
  if (module.match(/\.m?js$/)) {
    return loadModule(module)
  } else if (module.match(/^[a-z0-9_-]+$/)) {
    return loadModule(localFile(`modules/${module}.js`))
  } else {
    error("Module must be plain name or .js or .mjs file!")
  }
}

program.name(pkg.name)
program.description(pkg.description)
program.version(pkg.version)
program
  .argument("[input]", "RDF input file (default: - for stdin)")
  .option("-f, --from <format>", "input RDF format (default from file name or turtle)")
  .option("-t, --to <format>", "output RDF format (default from file name or nt)")
  .option("-o, --output <file>", "RDF output file","-")
  .option("-m, --module <name>", "filter module name or .js/.mjs file")
  .option("-s, --stats", "print statistics at the end")
  .action(async (input, { output, from, to, module, stats }) => {
    input ||= "-"
    output ||= "-"
    from = getFormat(input, from, "input")
    to = getFormat(output, to, "output")
    input = input === "-" ? process.stdin : fs.createReadStream(input)
    output = output === "-" ? process.stdout : fs.createWriteStream(output)
    input.on("error", error)
    output.on("error", error)

    // TODO: support multiple filter modules
    const filter = module ? await filterFromModule(module) : undefined
    rdffilter(input, output, { from, to, filter, stats })
  })

program.parse(process.argv)
