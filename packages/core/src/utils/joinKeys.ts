export const joinKeys = (...keys: (string | null)[]) => keys?.filter(Boolean)?.join('.')
