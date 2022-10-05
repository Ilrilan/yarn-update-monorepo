#!/usr/bin/env node

const { writeFileSync } = require('fs')
const { findPackageJSON } = require('./get-workspaces')
const { shell } = require('./utils')

const pwd = process.cwd()

function updateMonorepo(namespace, depType) {

    /**
     * Ключ - название пакета из пространства namespace
     * Значение - последняя версия
     */
    const platformVersions = new Map()

    const updatedPackages = []

    function getLatestVersion(packageName) {
        const outpupt = shell(`yarn info --json ${packageName}`, { pwd, stdio: 'pipe', encoding: 'utf-8' })
        const infoJSON = JSON.parse(outpupt)

        return infoJSON.data['dist-tags'].latest
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
        Object.keys(platformDeps).forEach((dep) => {
            const latestVersion = getLatestVersion(dep)

            dependencies[dep] = depType === ('minor' ? '^' : '') + latestVersion
        })
    }

    findPackageJSON(pwd).forEach((packageJSONPath) => {
        const packageJSON = require(packageJSONPath)

        if (!packageJSON || !packageJSON.dependencies) {
            return
        }

        const platformDeps = filterPlatformDeps(packageJSON.dependencies)

        if (!platformDeps || platformDeps.length === 0) {
            return
        }

        calculateUndefinedVersionDeps(platformDeps)
        fillLatestVersionsDeps(packageJSON.dependencies, platformDeps)
        writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2) + '\n', { encoding: 'utf-8' })

        updatedPackages.push(packageJSON.name)
    })

    return updatedPackages
}

module.exports = { updateMonorepo }
