import { bench, describe } from 'vitest'
import { createState } from '../createState'

const buildFragment = (layerCount = 100) => {
  const state = createState()

  const leafCount = Math.floor(layerCount * 0.6)
  const containerCount = layerCount - leafCount

  const leafKeys: string[] = []
  for (let i = 0; i < leafCount; i++) {
    const key = state.mutate({ _type: 'Text', _id: `t${i}`, content: `leaf ${i}` }) as string
    leafKeys.push(key)
  }

  const containerKeys: string[] = []
  for (let i = 0; i < containerCount; i++) {
    const childA = leafKeys[(i * 2) % leafCount]
    const childB = leafKeys[(i * 2 + 1) % leafCount]
    const key = state.mutate({
      _type: 'Frame',
      _id: `f${i}`,
      children: [childA, childB],
    }) as string
    containerKeys.push(key)
  }

  const rootKey = state.mutate({
    _type: 'Root',
    _id: 'main',
    children: containerKeys,
  }) as string

  return { state, rootKey }
}

describe('resolve perf', () => {
  const { state, rootKey } = buildFragment(100)

  bench('resolve(root) — 100 layers, depth 3', () => {
    state.resolve(rootKey)
  })

  bench('resolve(root) — 100 layers, depth 3, deep=true', () => {
    state.resolve(rootKey, { deep: true })
  })

  bench('mutate(leaf) on hot fragment', () => {
    state.mutate('Text:t5', { content: `updated ${Math.random()}` })
  })
})
