const cache = new Set<string>()

const wrapMessage = (message: string) => `[GraphState]: ${message}`

export function warn(message: string) {
  if (!cache.has(message)) {
    console.warn(wrapMessage(message))
    cache.add(message)
  }
}

export function debug(message: string) {
  if (process.env.NODE_ENV !== 'production') {
    if (!cache.has(message)) {
      console.warn(wrapMessage(message))
      cache.add(message)
    }
  }
}
