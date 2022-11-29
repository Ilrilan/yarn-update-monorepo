#!/usr/bin/env node

const args = require('args');
const fs = require('fs')
const os = require('os')
const path = require('path')
const { updateMonorepo } = require('../src/update-monorepo')
const { cleanYarnLock } = require('../src/clean-yarn-lock')

const ALLOWED_DEP_TYPES = ['strict', 'minor'];

const pathToUnixPath =
    os.platform() === 'win32' ? (str) => str.replace(/\\/g, '/') : (str) => str

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
    },
    {
        name: 'fixedVersion',
        description: 'Fixed version for all packages (for canary releases)'
    },
    {
        name: 'cleanYarnLockFlag',
        description: 'flag to cleaning yarn.lock from unused deps in scope in same command'
    }
])

const parsedArgs = args.parse(process.argv);
const { scope, depType, fixedVersion, cleanYarnLockFlag } = parsedArgs
let { registry } = parsedArgs

if (!scope) {
    throw new Error('Scope for updating deps is not defined! Example: update-monorepo -s @babel -d minor');
}

if (!depType) {
    throw new Error('Dependency type must be defined! Example:  -s @babel -d minor');
}

if (fixedVersion) {
    console.log(`Fixed version set, quering to npm registry disabled`)
} else {
    if (!registry) {
        if (fs.existsSync(pathToUnixPath(path.resolve(path.join(process.cwd(), '.npmrc'))))) {
            const npmConf = require('rc')('npm', {})
            if (npmConf.registry) {
                registry = npmConf.registry
                console.log(`Read registry url from .npmrc: ${registry}`)
            }
        }
        if (!registry) {
            throw new Error('Registry is not defined. Use param "-r" or write it in the .npmrc file in the current directory')
        }
    }
}

if (!ALLOWED_DEP_TYPES.some(allowedDepType => depType === allowedDepType)) {
    throw new Error(`Dependency type can be only "strict" or "minor"`)
}

let pathToLockFile
if (cleanYarnLockFlag) {
    pathToLockFile = path.resolve(process.cwd(), 'yarn.lock')
    if (!fs.existsSync(pathToLockFile)) {
        throw new Error(`Yarn lock file not found in ${pathToLockFile}`)
    }
}

const result = updateMonorepo(scope, depType, registry, fixedVersion)
console.log(`Updated ${result.length} packages:   n${result.join(', ')}`)

if (cleanYarnLockFlag) {
    cleanYarnLock(scope, pathToLockFile)
}

process.exit(0)
