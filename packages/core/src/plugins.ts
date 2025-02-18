import type { GraphState, Plugin } from 'src'

export const createPluginsState = (initialPlugins: Plugin[] = []) => {
  const plugins: Plugin[] = []

  const use = (plugin: Plugin) => {
    plugins.push(plugin)
  }

  const runPlugins = (state: GraphState) => {
    return plugins.reduce((graphState, plugin) => plugin(graphState) ?? graphState, state)
  }

  initialPlugins.forEach(use)

  return {
    use,
    runPlugins,
  }
}
