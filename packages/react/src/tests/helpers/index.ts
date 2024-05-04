export const generateId = () => Math.random().toString(16).slice(2)

export const random = (min: number, max: number) => Math.floor(min + Math.random() * (max + 1 - min))
