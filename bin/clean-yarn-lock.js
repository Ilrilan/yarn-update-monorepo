#!/usr/bin/env node

const args = require('args')
const fs = require('fs')
const path = require('path')
const lockfile = require('@yarnpkg/lockfile')

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

const lockFileContent = fs.readFileSync(pathToLockFile, { encoding: 'utf-8' })
const lockFileObj = lockfile.parse(lockFileContent).object

let updatedPackages = 0

Object.keys(lockFileObj)
    .filter(depName => depName.indexOf(scope) !== -1)
    .forEach(depName => {
        updatedPackages++
        //console.log(`Removing dep to ${depName}`)
        delete lockFileObj[depName]
    })

if (updatedPackages > 0) {
    console.log(`Removed ${updatedPackages} strings from yarn.lock in ${scope}`)
    const dedupedContent = lockfile.stringify(lockFileObj)
    fs.writeFileSync(pathToLockFile, dedupedContent, {encoding: 'utf-8'})
} else {
    console.log(`Not found strings in ${scope}, yarn.lock was not modified`)
}
