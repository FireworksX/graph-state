import type { GraphState, Plugin, PluginDeclareOverride, PluginOverrider } from 'src'

export const createPluginsStore = <TState extends GraphState>(state: TState, initialPlugins: Plugin[] = []) => {
  const plugins: Plugin[] = []
  const overrides = { mutate: [] as PluginOverrider[] }

  const declareOverrideMutate: PluginDeclareOverride = (overrider: PluginOverrider) => {
    overrides.mutate.push(overrider)
  }

  const registerPlugin = (plugin: Plugin) => {
    plugins.push(plugin)
  }

  const runPlugins = () => {
    return plugins.reduce(
      (graphState, plugin) => plugin(graphState, { overrideMutate: declareOverrideMutate }) ?? graphState,
      state
    )
  }

  initialPlugins.forEach(registerPlugin)

  const originalMutate = state.mutate

  const overrideMutate = <TParams extends Parameters<TState['mutate']>>(...args: TParams) => {
    // @ts-ignore
    const { graphKey: entityGraphKey, data, options } = state.getArgumentsForMutate(...args)

    let index = -1
    let result = null
    const graphKey = entityGraphKey ?? state.key

    const next: any = (...nextArgs: any[]) => {
      index++
      if (index < overrides.mutate.length) {
        // @ts-ignore
        overrides.mutate[index](next, ...nextArgs)
      } else {
        // @ts-ignore
        const { data: nd } = state.getArgumentsForMutate(...nextArgs)

        // @ts-ignore
        result = originalMutate(graphKey, nd, {
          ...options,
          overrideMutateMethod: overrideMutate,
        })
        return result
      }
    }

    next(graphKey, data, options)
    return result
  }

  state.mutate = overrideMutate

  return {
    registerPlugin,
    runPlugins,
  }
}
