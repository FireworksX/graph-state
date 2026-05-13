# Spec: оптимизация `resolve` в `@graph-state/core`

**Дата:** 2026-05-13
**Ветка:** `performance`
**Источник анализа:** `/Users/fireworks/dev/fragments/.worktrees/fix-performance/.planning/client-traces/GRAPH-STATE-PERF.md`

---

## 1. Цель

Уменьшить self-time функции `resolve` в `@graph-state/core` (по клиентским трейсам — 20% CPU всего трейса click, ~175 ms на одном трейсе). Сохранить публичный API, не вносить breaking changes, не менять контракт иммутабельности.

## 2. Scope

Включены **Top-3 high-ROI** фиксы из отчёта **без фикса №1** (spread сохраняется по решению владельца):

- **Фикс #2** — Skip `reduce` для leaf-узлов (без children-links).
- **Фикс #3** — Per-pass resolve cache внутри одной synchronous resolve-сессии.

Out of scope в этом spec (отложено в backlog):

- Фикс #1 — убрать финальный spread (сохраняем контракт `resolve` всегда возвращает новый объект).
- Фикс #4 — `Set<LinkKey>` вместо `LinkKey[]` для refs (breaking API).
- Фиксы #5–10 — мелкие/средние оптимизации (`notify`, `readLink`, `uniqueLinks`, `joinKeys`, `isSkipped` memo, deprecated `warn` в `keyOfEntity`).
- Фиксы #11–13 — мажорный refactor (signal-reactivity, batched GC).

## 3. Затрагиваемые компоненты

| Файл | Изменение |
|---|---|
| `packages/core/src/createState.ts` | Изменения внутри `resolve` (~l.75–123) и `safeResolve` (~l.125–128). Публичный API без изменений. |
| `packages/core/src/types.ts` (l.108, где определён `ResolveOptions`) | Расширить `ResolveOptions` приватным полем `_resolveCache?: Map<string, unknown>` с `@internal`. |
| `packages/core/src/tests/createState.test.ts` | Добавить точечные тесты: регрессия output, per-pass cache hit, leaf-skip, изоляция top-level вызовов, selector path. |
| `packages/core/src/tests/bench.test.ts` (новый) | `vitest bench()` — измерение resolve/mutate на репрезентативном графе. |

**Не меняется:** `cache.ts`, `mutate`, `notify`, `subscribe`, сигнатуры публичных методов.

## 4. Архитектура

### 4.1 Контракт иммутабельности

`state.resolve(K)` всегда возвращает свежий объект через финальный `{ ...value }`. Per-pass cache живёт только внутри одной synchronous resolve-сессии и **не пересекает top-level вызовы** — два последовательных `state.resolve(K1)` дают разные ссылки. Это сознательное ограничение.

### 4.2 Граница per-pass cache

- Map создаётся в первом (top-level) вызове `resolve`.
- Пробрасывается во все рекурсивные `safeResolve` через `_resolveCache` в `coreOptions`.
- После возврата top-level resolve — Map уходит на GC.
- Безопасность: внутри synchronous resolve `cache.links` не меняется (`mutate` не вмешивается между двумя `safeResolve`).

### 4.3 Условие применения cache

Кэш активен **только когда `selector === undefined` и `deep === false`**. Это:

- Покрывает все internal `safeResolve` (они вызываются без этих опций).
- Упрощает корректность — cache хранит одну форму результата.
- Selector path и deep path остаются без изменений.

## 5. Детали реализации

### 5.1 Фикс #2 — Skip reduce для leaf-узлов

В `resolve()` перед `Object.entries(value).reduce(...)` (~l.90) добавляем guard:

```ts
const hasChildren = (cache.getChildren(inputKey)?.length ?? 0) > 0

if ((hasChildren || isDeep) && (isObject(value) || Array.isArray(value))) {
  value = Object.entries(value).reduce((acc, [key, value]) => {
    // существующая логика
  }, {} as Graph)
}
```

**Корректность:**
- `cache.getChildren(inputKey)` синхронизирован — `addRefs` зовётся внутри `writeLink` в `mutate` синхронно до `notify`.
- `inputKey === null` → `hasChildren = false` → reduce пропускается, если не `isDeep`. Безопасно: без ключа нечего разворачивать.
- `isDeep === true` → reduce запускается всегда, как сейчас.

### 5.2 Фикс #3 — Per-pass resolve cache

**1. Расширяем `ResolveOptions`:**

```ts
export interface ResolveOptions<...> {
  // existing fields...
  /** @internal */
  _resolveCache?: Map<string, unknown>
}
```

**2. В начале `resolve()` — создаём/принимаем cache, делаем short-circuit:**

```ts
const canUseCache = !selector && !isDeep
const passCache = canUseCache
  ? (options?._resolveCache ?? new Map<string, unknown>())
  : undefined

if (inputKey && passCache?.has(inputKey)) {
  return passCache.get(inputKey) as any
}
```

**3. Пробрасываем в `coreOptions` для рекурсии:**

```ts
const { selector, ...coreOptions } = options || {}
if (passCache) (coreOptions as any)._resolveCache = passCache
```

(Эта запись после деструктуризации `coreOptions` — чтобы не перезаписать другие поля.)

**4. В конце `resolve()` — кладём `finalValue` (после spread) в cache до return:**

```ts
const finalValue = value
  ? (selector ? selector({ ...value }) : { ...value })
  : (isSafe ? input : null)

if (canUseCache && inputKey && value) {
  passCache!.set(inputKey, finalValue)
}

return finalValue as any
```

**Почему `finalValue`, а не raw `value`:** повторный hit возвращает ту же ссылку, что используется в `acc[key] = resultValue` в reduce parent'а. Это «развёрнутый» объект, как ожидает consumer.

### 5.3 Взаимодействие фиксов

Аддитивны и не конфликтуют:
- Фикс #2 (leaf skip) — пропускает reduce, когда у графа нет детей.
- Фикс #3 (per-pass cache) — пропускает повторный resolve того же ключа в одной сессии.
- Оба независимо проверяются в тестах.

## 6. Тесты

В `packages/core/src/tests/createState.test.ts` добавить:

**Тест 1 — Регрессия формы (главный):** граф с cross-refs (parent → A, A → B, parent → B), `JSON.stringify(state.resolve(parent))` должен совпадать с baseline-объектом byte-to-byte.

**Тест 2 — Per-pass cache:** wrap `cache.readLink` в счётчик. После `state.resolve(parent)`, где parent ссылается на `K1` в двух полях, `readLink(K1)` вызван ровно один раз.

**Тест 3 — Leaf-skip:** `vi.spyOn(Object, 'entries')`. Резолв leaf-графа без children-links не вызывает `Object.entries` на graph value.

**Тест 4 — Изоляция top-level:** два последовательных `state.resolve(K1)` возвращают разные ссылки (`r1 !== r2`).

**Тест 5 — Selector path:** `state.resolve(K1, { selector })` отрабатывает корректно (smoke).

## 7. Benchmark

Новый файл `packages/core/src/tests/bench.test.ts` с `vitest bench()`:

```ts
import { bench, describe } from 'vitest'
import { createState } from '../createState'

describe('resolve perf', () => {
  const { state, rootKey } = buildFragment(100) // 100 layers, depth 3, с cross-refs

  bench('resolve(root) — 100 layers, depth 3', () => {
    state.resolve(rootKey)
  })

  bench('resolve(root) — 100 layers, depth 3, deep=true', () => {
    state.resolve(rootKey, { deep: true })
  })

  bench('mutate(leaf field) on hot fragment', () => {
    state.mutate('Text:5', { content: Math.random().toString() })
  })
})
```

**Структура фрагмента (`buildFragment`):**
- Root frame с 50–100 children (mix of Text leaves и Frame containers).
- Depth 3 — Frame > Frame > Text.
- Cross-references — общий `Style:1` link на 5 layers (имитация shared style).

**Замеры:**
- Перед фикс #2 — baseline (commit a).
- После #2 — числа в commit-message b.
- После #3 — числа в commit-message c.

## 8. Порядок реализации

**Вариант A — инкрементальный** (выбран):

1. **Коммит a** — `bench.test.ts` + новые точечные тесты + baseline-числа в commit-message. Без изменений в `createState.ts`.
2. **Коммит b** — фикс #2 (leaf skip). `yarn test` зелёный. Bench-числа в commit-message.
3. **Коммит c** — фикс #3 (per-pass cache). `yarn test` зелёный. Bench-числа в commit-message.

Каждый коммит изолирован — даёт гранулярный rollback.

## 9. Риски и митигация

| Риск | Вероятность | Митигация |
|---|---|---|
| Per-pass cache возвращает stale-ссылку при синхронной мутации внутри resolve (plugin) | низкая | Регрессионный тест #1 + тест #4. Если найдём edge case — отключаем cache при наличии write-плагинов. |
| Skip reduce пропускает узел, у которого `childrenRefs` ещё не записан | очень низкая | `addRefs` синхронен до `notify`. Покрытие через тест #1 и `cache.test.ts`. |
| Поле `_resolveCache` всплывает в типах consumer'а | низкая | `@internal` + префикс `_`. При необходимости — миграция на Symbol-ключ. |
| Bench-числа flaky на CI | средняя | Bench запускаем локально, числа фиксируем в commit-message. CI прогоняет только unit-тесты. |

## 10. Rollback

- Коммит **b** (leaf skip) — `git revert <sha-b>`. Изолирован, один if-блок.
- Коммит **c** (per-pass cache) — `git revert <sha-c>`. Изолирован, изменения в начале/конце `resolve` + одно поле в `ResolveOptions`.

## 11. Критерии готовности

1. `yarn test` зелёный.
2. Bench показывает измеримое улучшение для `resolve(root)` на сценарии с cross-refs (ожидание −30…−60% time или +50…+150% ops/sec).
3. Bench показывает измеримое улучшение для `resolve(root)` на leaf-heavy сценарии (ожидание −20…−40% time).
4. Регрессионный тест #1 проходит — output идентичен baseline.

## 12. Дальнейшие шаги

После аппрува spec'а — переход в `superpowers:writing-plans` skill для детального implementation plan'а с пошаговыми задачами.
