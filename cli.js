#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
const pkg = await fs.readFileSync(new URL('package.json', import.meta.url))

import { program } from 'commander'

import { rdffilter, formats } from './rdffilter.js'

function error(msg, code=1) {
  console.error(`${msg}`)
  process.exit(code)
}

function getFormat(file, format, type) {
  format ||= file.split('.').slice(1)[0]
  if (format && !(format in formats)) error(`${type} format ${format} not supported!`)
  return format
}

async function filterFromModule(module) {
  if (module.match(/\.m?js$/)) {
    return await import(path.resolve(module))
      .then(mod => module = mod.default) 
      .catch(e => {
        if (e.code =='ERR_MODULE_NOT_FOUND') {
          e = `Module not found: ${module}`
        } else if (e.stack) {       
          e = e.stack.split(/\n\s*/).slice(0,2).join(' ')
        } else {
          e = `Error in module ${module}: ${e.message}`
        }
        error(e)
      })
  } else {
    error(`Module must be .js or .mjs file!`)
  }
}

program.name(pkg.name)
program.description(pkg.description)
program.version(pkg.version)
program
  .argument('[input]', 'RDF input file (default: - for stdin)')
  .option('-f, --from <format>', 'input RDF format (default from file name or turtle)')
  .option('-t, --to <format>', 'output RDF format (default from file name or nt)')
  .option('-o, --output <file>', 'RDF output file','-')
  .option('-m, --module <file>', 'filter module .js file')
  .action(async (input, { output, from, to, module }) => {
     input ||= '-'
     output ||= '-'
     from = getFormat(input, from, "input")
     to = getFormat(output, to, "output")
     input = input === '-' ? process.stdin : fs.createReadStream(input)
     output = output === '-' ? process.stdout : fs.createWriteStream(output)
     input.on('error', error)
     output.on('error', error)

     const filter = module ? await filterFromModule(module) : undefined

     rdffilter(input, output, { from, to, filter })
  })

program.parse(process.argv)
