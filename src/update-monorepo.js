#!/usr/bin/env node

const { writeFileSync } = require('fs')
const { findPackageJSON } = require('./get-workspaces')
const { shell } = require('./utils')
const os = require('os')


const pathToUnixPath =
    os.platform() === 'win32' ? (str) => str.replace(/\\/g, '/') : (str) => str

const cwd = pathToUnixPath(process.cwd())

function updateMonorepo(namespace, depType, registry, fixedVersion) {

    /**
     * Ключ - название пакета из пространства namespace
     * Значение - последняя версия
     */
    const platformVersions = new Map()

    const updatedPackages = []

    const packageVersions = []

    function getLatestVersion(packageName) {
        if (!packageVersions[packageName]) {
            if (!fixedVersion) {
                console.log(`Getting version for ${packageName} package:`)
                const textCommand = `yarn info --json ${packageName} --registry ${registry}`
                const output = shell(textCommand, {
                    cwd,
                    stdio: 'pipe',
                    encoding: 'utf-8'
                })
                try {
                    const infoJSON = JSON.parse(output)

                    packageVersions[packageName] = infoJSON.data['dist-tags'].latest
                    console.log(`         found ${packageVersions[packageName]}`)
                } catch (e) {
                    console.error(`Cannot parse yarn info! Try to execute command "${textCommand}", response must be in JSON format`)
                    throw e
                }
            } else {
                console.log(`Version for ${packageName} is fixed: ${fixedVersion}`)
                return fixedVersion
            }
        }
        return packageVersions[packageName]
    }

    function filterPlatformDeps(dependencies) {
        return Object.keys(dependencies)
            .filter((dep) => dep.indexOf(namespace) !== -1)
            .reduce((col, dep) => {
                col[dep] = dependencies[dep]
                return col
            }, {})
    }
    function calculateUndefinedVersionDeps(dependencies) {
        Object.keys(dependencies)
            .filter((dep) => platformVersions.has(dep))
            .forEach((dep) => {
                const latestVersion = getLatestVersion(dep)

                platformVersions.set(dep, latestVersion)
            })
    }
    function fillLatestVersionsDeps(dependencies, platformDeps) {
        if (!dependencies) {
            return
        }
        const platformDepsKeys = Object.keys(platformDeps)
        Object.keys(dependencies)
            .filter(depName => platformDepsKeys.indexOf(depName) !== -1)
            .forEach((dep) => {
                const latestVersion = getLatestVersion(dep)

                dependencies[dep] = (depType === 'minor' ? '^' : '') + latestVersion
            })
    }

    findPackageJSON(cwd).forEach((packageJSONPath) => {
        const packageJSON = require(packageJSONPath)

        if (!packageJSON || (!packageJSON.dependencies && !packageJSON.devDependencies && !packageJSON.peerDependencies)) {
            return
        }

        const platformDeps = {
            ...filterPlatformDeps(packageJSON.dependencies || {}),
            ...filterPlatformDeps(packageJSON.devDependencies || {}),
            ...filterPlatformDeps(packageJSON.peerDependencies || {})
        }

        if (!platformDeps || Object.keys(platformDeps).length === 0) {
            return
        }

        console.log(`Processing ${packageJSON.name} dependencies: found ${Object.keys(platformDeps).length} packages`)

        calculateUndefinedVersionDeps(platformDeps)
        fillLatestVersionsDeps(packageJSON.dependencies, platformDeps)
        fillLatestVersionsDeps(packageJSON.devDependencies, platformDeps)
        fillLatestVersionsDeps(packageJSON.peerDependencies, platformDeps)
        writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2) + '\n', { encoding: 'utf-8' })

        updatedPackages.push(packageJSON.name)
    })

    return updatedPackages
}

module.exports = { updateMonorepo }
