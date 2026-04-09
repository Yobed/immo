const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [path.resolve(workspaceRoot, 'packages/shared')]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

const react19Dir = path.resolve(projectRoot, 'node_modules/react')
const reactDom19Dir = path.resolve(projectRoot, 'node_modules/react-dom')

// Force React 19 (mobile) pour TOUT le bundle — expo-router 6 requiert React.use()
// path.resolve avec un chemin absolu sur Windows ignore le premier arg → utiliser path.join
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { filePath: path.join(react19Dir, 'index.js'), type: 'sourceFile' }
  }
  if (moduleName.startsWith('react/')) {
    const sub = moduleName.slice('react/'.length)  // ex: 'jsx-dev-runtime'
    const candidate = path.join(react19Dir, sub + '.js')
    return { filePath: candidate, type: 'sourceFile' }
  }
  if (moduleName === 'react-dom') {
    return { filePath: path.join(reactDom19Dir, 'index.js'), type: 'sourceFile' }
  }
  if (moduleName.startsWith('react-dom/')) {
    const sub = moduleName.slice('react-dom/'.length)
    return { filePath: path.join(reactDom19Dir, sub + '.js'), type: 'sourceFile' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

config.resolver.extraNodeModules = {
  '@immo-ci/shared': path.resolve(workspaceRoot, 'packages/shared'),
}

module.exports = config
