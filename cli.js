#!/usr/bin/env node

import fs from "fs"
import path from "path"

import { fileURLToPath } from "url"
const pkgFile = file => fileURLToPath(new URL(file, import.meta.url))
const pkg = await fs.readFileSync(pkgFile("package.json"))

import { program } from "commander"

import { rdffilter } from "./index.js"

function error(msg, code=1) {
  console.error(`${msg}`)
  process.exit(code)
}

function listModules() {
  const files = fs.readdirSync(pkgFile("modules")).filter(name => name.endsWith(".js")).sort()
  const len = Math.max(...files.map(n => n.length))
  for (let name of files) {
    const comment = fs.readFileSync(pkgFile(`modules/${name}`)).toString().split("\n")[0]
    console.log(name.slice(0,-3) + " ".repeat(len - name.length), comment)
  }
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
    return loadModule(pkgFile(`modules/${module}.js`))
  } else {
    error("Module must be plain name or .js or .mjs file!")
  }
}

const collect = (value, previous) => previous.concat([value])

program.name(pkg.name)
program.description(pkg.description)
program.version(pkg.version)
program
  .argument("[input]", "RDF input file (default: - for stdin)")
  .option("-f, --filter <name>", "filter module name or local .js/.mjs file", collect, [])
  .option("-q, --quads", "process quads (read TriG, write N-Quads)")
  .option("-t, --to <format>", "output RDF format (default from file name or nt)")
  .option("-o, --output <file>", "RDF output file","-")
  .option("-l, --list", "list filter module names and quit")
  .option("-k, --kept", "emit kept quads")
  .option("-a, --added", "emit added quads")
  .option("-r, --removed", "emit removed quads")
  .option("-s, --stats", "print statistics at the end")
  .action(async (input, options) => {
    if (options.list) {
      listModules()
      process.exit(0)
    }

    const select = options.kept || options.added || options.removed
    const kept = select ? !!options.kept : true
    const added = select ? !!options.added : true
    const removed = select ? !!options.removed : false

    var { output, quads, to, filter, stats } = options

    input ||= "-"
    output ||= "-"

    // input/output format
    const from = input.split(".").slice(1)[0]
    if (from == "nq" || from == "trig") { quads = true }

    to ||= output.split(".").slice(1)[0] || (quads ? "nq" : "nt")
    if (to == "nq" || to == "trig") { quads = true }
    if (!to.match(/^(ttl|turtle|nt|nq|trig)$/)) {
      error(`output format ${to} not supported!`)
    } else if (quads && to !== "nq" && to !== "trig") {
      error(`output format ${to} does not support named graphs, use nq or trig format!`)
    }

    // input/output stream
    input = input === "-" ? process.stdin : fs.createReadStream(input)
    output = output === "-" ? process.stdout : fs.createWriteStream(output)
    input.on("error", error)
    output.on("error", error)

    filter = await Promise.all(filter.map(m => filterFromModule(m)))

    rdffilter(input, { quads, to, filter, stats, added, kept, removed }).pipe(output)
  })

program.parse(process.argv)
