#!/usr/bin/env node

const args = require('args')
const fs = require('fs')
const path = require('path')

const { cleanYarnLock } = require('../src/clean-yarn-lock')

args.options([
    {
        name: 'scope',
        description: 'Package namespace for clearing lock file',
    },
])

const { scope } = args.parse(process.argv)

if (!scope) {
    throw new Error('Scope for clearing lock file strings is not defined! Example: clean-yarnlock -s @babel');
}

const pathToLockFile = path.resolve(process.cwd(), 'yarn.lock')

if (!fs.existsSync(pathToLockFile)) {
    throw new Error(`Yarn lock file not found in ${pathToLockFile}`)
}

cleanYarnLock(scope, pathToLockFile)
