#!/usr/bin/env node

import fs from 'node:fs'
const { name, version, description } = JSON.parse(await fs.readFileSync('package.json'))

import { Command } from 'commander'
const program = new Command()

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

import filter from './filter.js' // TODO load dynamically

program
  .name(name).description(description).version(version)
  .argument('[input]', 'RDF input file (default: - for stdin)')
  .argument('[output]', 'RDF output file (default: - for stdout)')
  .option('-f, --from <format>', 'input RDF format (default: guess from from file extension or Turtle)')
  .option('-t, --to <format>', 'output RDF format (default: guess from from file extension or NTriples)')
  .option('-c, --config <file>', 'filter configuration (.js file)')
  .action(async (input, output, { from, to, config }) => {
     input ||= '-'
     output ||= '-'
     from = getFormat(input, from, "input") || 'turtle'
     to = getFormat(output, to, "output") || 'nt'
     input = input === '-' ? process.stdin : fs.createReadStream(input)
     output = output === '-' ? process.stdout : fs.createWriteStream(output)
     input.on('error', error)
     output.on('error', error)

     if (config) {
        if (config.match(/\.js$/) && fs.existsSync(config)) {
          // TODO: turn into absolute path
          await import(`./${config}`).then(mod => config = mod.default)
        } else {
          error(`Configuration must be existing .js file!`)
        }
     }

     rdffilter(input, output, { from, to, config })
  })

program.parse(process.argv)
