Simple utility for updating all dependencies for target namespace in all package.json files in Yarn monorepo.

Working algorithm:
 - get workspaces from yarn
 - find all package.json files in workspaces
 - get all packages from target namespace in `dependencies`, `devDependencies` and `peerDependencies` categories in package.json files
 - read NPM registry and get latest version for each dependency
 - write target versions in package.json files
 - (optional, if cleanYarnLockFlag set) clean yarn lock 

### Main command: `update-monorepo`

Flags:

- `-s` - namespace for updating dependencies, required. For example `@babel` - utility will find all babel deps in current yarn workspaces and change it versions in package.json files 
- `-d` - dependency type, required. Can be `strict` (writed deps `X.X.X`) or `minor` (writed deps `^X.X.X`)
- `-r` - registry, optional, if utility can read registry from `.npmrc`, otherwise parameter is required
- `-f` - fixed version, optional. If set, registry will not be used, all dependencies resolved to fixed version
- `-c` - clean yarn lock flag. If set, utility will also find in yarn.lock all strict dependency records which can't be deduped later and remove they

### Utility command: `clean-yarnlock`

Flags:

- `-s` - namespace for cleaning dependency records

##Examples

- `yarn update-monorepo -d strict -s @babel` - find all `@babel/` deps in current monorepo and bump it to latest strict versions
- `yarn update-monorepo -d minor -s @babel -r https://myRegistry` - find all `@babel/` deps in current monorepo and bump it to latest minor versions, working with `https://myRegistry` 
- `yarn update-monorepo -d strict -s @babel -f 8.0.0` - find all `@babel/` deps in current monorepo and change versions to `8.0.0`
- `yarn clean-yarnlock -s @babel` - find all dependencies for `@babel/` namespace, filter only records with strict inner deps, that can't be dedupes and remove they
