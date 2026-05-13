---
"@graph-state/core": minor
---

Optimize `resolve` performance with two fixes:

- **Skip reduce for leaf-nodes** — графы, у которых никогда не было детей-link'ов
  (чистые leaf-узлы вроде `Text`), пропускают `Object.entries(value).reduce()`
  целиком. Условие через `childrenRefs.has(K)`, что сохраняет dead-link cleanup
  в `invalidate`-сценариях.
- **Per-pass resolve cache** — cross-references больше не разворачиваются
  повторно в рамках одной synchronous resolve-сессии. Cache активен когда
  `selector === undefined`, живёт только между top-level и рекурсивными
  safeResolve, не пересекает границы между внешними `state.resolve(K)` вызовами.
  Контракт иммутабельности сохраняется.

Замеры на 100-layer фрагменте: `resolve(root, deep)` +24%, `mutate(leaf)` +96%.
