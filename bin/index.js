#!/usr/bin/env node

const args = require('args');
const { updateMonorepo } = require('../src/update-monorepo')

const ALLOWED_DEP_TYPES = ['strict', 'minor'];

args.options([
    {
        name: 'scope',
        description: 'Package namespace for updating deps',
    },
    {
        name: 'depType',
        description: 'Dependency type - minor (^x.x.x) or string (x.x.x)'
    },
    {
        name: 'registry',
        description: 'NPM registry for searching packages'
    }
])

const { scope, depType, registry } = args.parse(process.argv);

if (!scope) {
    throw new Error('Scope for updating deps is not defined! Example: update-monorepo -s @babel -d minor');
}

if (!depType) {
    throw new Error('Dependency type must be defined! Example:  -s @babel -d minor');
}

if (!registry) {
    throw new Error('Registry param must be defined')
}

if (!ALLOWED_DEP_TYPES.some(allowedDepType => depType === allowedDepType)) {
    throw new Error(`Dependency type can be only "strict" or "minor"`)
}

const result = updateMonorepo(scope, depType, registry)
console.log(`Updated ${result.length} packages: \n\n${result.join(', ')}\n\n`)
process.exit(0)
