const { existsSync } = require('fs')
const { join } = require('path')
const { shell } = require('./utils')

function getWorkspacesPaths(cwd) {
    const output = shell('yarn -s workspaces info --json', { cwd, stdio: 'pipe', encoding: 'utf-8' }, { noColor: true })
    const ws = JSON.parse(output)

    return Object.keys(ws).map((wsName) => join(cwd, ws[wsName].location))
}

/**
 * Находит пути ко всем packges.json, которые есть в директории формы
 *
 * @param {string}  formDir  путь к директории формы
 *
 * @returns {string[]}  массив путей к package.json внутри директории формы
 */
function findPackageJSON(formDir) {
    const rootPath = join(formDir, 'package.json')
    const wsPaths = getWorkspacesPaths(formDir).map((wsPath) => join(wsPath, 'package.json'))
    const paths = [rootPath].concat(wsPaths)

    return paths.filter((path) => existsSync(path))
}

module.exports = { findPackageJSON }
