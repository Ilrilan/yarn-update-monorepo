const { execSync } = require('child_process')

function shell(command, execOptions = {}, commandOptions = {}) {
    const env = execOptions.env || process.env
    // https://gitlab.com/gitlab-org/gitlab-runner/-/issues/1327
    const fullEnv = commandOptions.noColor ? { ...env, NO_COLOR: 'true', FORCE_COLOR: '0' } : env

    try {
        return execSync(command, {
            stdio: 'inherit',
            ...execOptions,
            env: fullEnv,
        })
    } catch (error) {
        if (commandOptions.allowFailure) {
            console.error(error)
            return
        }

        throw error
    }
}

module.exports = { shell }
