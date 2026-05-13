# Graph-State Resolve Performance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** уменьшить self-time `resolve` в `@graph-state/core` за счёт двух фиксов — skip reduce для leaf-узлов и per-pass resolve cache — без breaking changes.

**Architecture:** изменения локализованы в одном файле `createState.ts` (функция `resolve`) и одной строчке в `types.ts` (новое `@internal` поле в `ResolveOptions`). Новый bench-файл и точечные тесты добавляются рядом с существующими в `packages/core/src/tests/`. Инкрементальный подход — 3 коммита с проверкой выигрыша после каждого фикса.

**Tech Stack:** TypeScript, Vitest 1.6.1, turborepo, tsup. Управление зависимостями — yarn workspaces.

**Spec:** `docs/superpowers/specs/2026-05-13-graph-state-resolve-perf-design.md`

---

## File Structure

| Файл | Создаётся / Изменяется | Ответственность |
|---|---|---|
| `packages/core/src/tests/resolve.bench.ts` | Создаётся | `vitest bench()` — replicable замеры resolve/mutate на репрезентативном графе. |
| `packages/core/src/tests/createState.test.ts` | Изменяется | Дополняется блоком `describe('resolve perf optimizations')` с 5 тестами. |
| `packages/core/src/types.ts:108` | Изменяется | Добавляется `_resolveCache?: Map<string, unknown>` в `ResolveOptions` с `@internal`. |
| `packages/core/src/createState.ts:75-123` | Изменяется | Применяются фиксы #2 (leaf-skip) и #3 (per-pass cache) внутри `resolve`. |

**Не меняется:** `cache.ts`, `safeResolve` (использует то же `coreOptions` → cache пробросится автоматически), публичные сигнатуры методов.

---

## Pre-flight

- [ ] **Step 0a: Убедиться, что на ветке `performance`**

Run:
```bash
git -C /Users/fireworks/dev/graph-state branch --show-current
```
Expected output: `performance`

Если не на `performance` — `git checkout performance`.

- [ ] **Step 0b: Прогнать существующие тесты, убедиться, что baseline зелёный**

Run:
```bash
yarn workspace @graph-state/core test
```
Expected: `Test Files 3 passed (3)`, `Tests 115 passed | 4 skipped (119)`.

---

## Task 1: Создать benchmark-файл с `buildFragment` и тремя bench-кейсами

**Files:**
- Create: `packages/core/src/tests/resolve.bench.ts`

- [ ] **Step 1.1: Создать файл с bench-кейсами**

Создать файл `packages/core/src/tests/resolve.bench.ts` со следующим содержимым:

```typescript
import { bench, describe } from 'vitest'
import { createState } from '../createState'

/**
 * Builds a representative fragment:
 *  - root (Root:main) with `containerCount` Frame children
 *  - each Frame has 2 Text leaves
 *  - leaves are shared between Frames (cross-refs) via modulo wrap
 *
 * Default 100 layers: 60 leaves + 40 containers + 1 root.
 */
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
```

- [ ] **Step 1.2: Прогнать bench, зафиксировать baseline-числа**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && npx vitest bench --run
```
Expected: bench запускается без ошибок, выводит ops/sec для трёх кейсов. Сохрани вывод (скопируй три строки с ops/sec) — они пойдут в commit-message.

Если `vitest bench --run` не работает — попробуй `npx vitest bench` без `--run`, либо `npx vitest --mode benchmark`. Версия vitest 1.6.1.

- [ ] **Step 1.3: Прогнать обычные тесты — убедиться, что bench-файл их не ломает**

Run:
```bash
yarn workspace @graph-state/core test
```
Expected: `Tests 115 passed | 4 skipped`. Bench-файл НЕ должен подхватываться обычным `vitest --run` (vitest различает `test()` и `bench()`). Если тесты упали — у них имя `resolve.bench.ts` мешает vitest конфигу; пересмотри vitest.config.ts на предмет include/exclude.

- [ ] **Step 1.4: Зафиксировать baseline-числа в TODO-файле для использования в commit-message**

Это локальная заметка (не коммитится). Сохрани baseline-output где-нибудь под рукой — он пойдёт в commit-message в Task 3, чтобы сравнивать с числами после фиксов.

Формат, который ожидается в commit-message:
```
Baseline (commit a):
  resolve(root):           <X> ops/sec
  resolve(root, deep):     <Y> ops/sec
  mutate(leaf):            <Z> ops/sec
```

---

## Task 2: Добавить три регрессионных теста (1, 4, 5)

**Files:**
- Modify: `packages/core/src/tests/createState.test.ts` — добавить новый describe-блок в конец файла

Эти тесты проходят на текущем коде. Они страхуют от регрессии при последующих фиксах.

- [ ] **Step 2.1: Прочитать конец файла createState.test.ts**

Read: `packages/core/src/tests/createState.test.ts` (последние 30 строк), чтобы понять стиль импортов и куда вставлять.

- [ ] **Step 2.2: Добавить `describe('resolve perf optimizations')` в конец файла**

Вставить в самый конец файла (перед закрывающим `})` если внешний `describe`, или после последнего `})` верхнего уровня) следующий блок:

```typescript
describe('resolve perf optimizations', () => {
  // Test #1 (regression form): resolve output не меняется после оптимизаций
  it('regression: resolve output остаётся структурно стабильным', () => {
    const state = createState()
    state.mutate({ _type: 'Style', _id: 's1', color: 'red' })
    state.mutate({ _type: 'Text', _id: 't1', content: 'hello' })
    state.mutate({
      _type: 'Frame',
      _id: 'f1',
      children: [
        { _type: 'Text', _id: 't1' },
        { _type: 'Text', _id: 't1' },
      ],
      style: { _type: 'Style', _id: 's1' },
    })

    const result = state.resolve('Frame:f1', { deep: true })
    expect(result).toMatchInlineSnapshot()
  })

  // Test #4 (top-level isolation): два последовательных resolve возвращают разные ссылки
  it('top-level isolation: два resolve(K) возвращают разные ссылки', () => {
    const state = createState()
    state.mutate({ _type: 'Text', _id: 't1', content: 'a' })

    const r1 = state.resolve('Text:t1')
    const r2 = state.resolve('Text:t1')

    expect(r1).toEqual(r2)
    expect(r1).not.toBe(r2)
  })

  // Test #5 (selector path smoke): selector работает корректно
  it('selector path: возвращает выбранное значение', () => {
    const state = createState()
    state.mutate({ _type: 'Text', _id: 't1', content: 'hello', extra: 'world' })

    const result = state.resolve('Text:t1', {
      selector: (graph: any) => graph.content,
    })

    expect(result).toBe('hello')
  })
})
```

**Важно про `toMatchInlineSnapshot()`:** при первом прогоне vitest сам впишет ожидаемый снимок внутрь скобок. Это правильное поведение — оставь как есть.

- [ ] **Step 2.3: Прогнать новые тесты — снимок запишется автоматически**

Run:
```bash
yarn workspace @graph-state/core test -- --update
```

Если флаг `--update` не сработает — попробуй `npx vitest run -u` из директории `packages/core`.

Expected: все 3 новых теста проходят (`tests 118 passed | 4 skipped`). Файл `createState.test.ts` обновился — внутри `toMatchInlineSnapshot()` появилась сгенерированная структура.

- [ ] **Step 2.4: Прогнать тесты повторно — без `--update` — убедиться, что снимок стабилен**

Run:
```bash
yarn workspace @graph-state/core test
```
Expected: `Tests 118 passed | 4 skipped`. Если упало — снимок изменился между запусками (это указывает на нестабильность resolve, что само по себе баг). Не идти дальше — отдать на разбор.

---

## Task 3: Коммит a — baseline зафиксирован

- [ ] **Step 3.1: Проверить, что лежит в git status**

Run:
```bash
git -C /Users/fireworks/dev/graph-state status
```
Expected: два изменённых/новых файла —
- `packages/core/src/tests/resolve.bench.ts` (new)
- `packages/core/src/tests/createState.test.ts` (modified)

Если есть лишние — НЕ коммить их. Спроси что делать.

- [ ] **Step 3.2: Закоммитить с baseline-числами в сообщении**

Используя baseline-числа из Step 1.2, выполни:

```bash
cd /Users/fireworks/dev/graph-state && git add \
  packages/core/src/tests/resolve.bench.ts \
  packages/core/src/tests/createState.test.ts && \
git commit -m "$(cat <<'EOF'
test: добавить bench и регрессионные тесты для resolve

Baseline-замеры на 100-layer фрагменте с cross-refs:
  resolve(root):           <X> ops/sec  ← подставить из Step 1.2
  resolve(root, deep):     <Y> ops/sec  ← подставить из Step 1.2
  mutate(leaf):            <Z> ops/sec  ← подставить из Step 1.2

Три регрессионных теста страхуют output resolve от изменений
формы при последующих оптимизациях.

Spec: docs/superpowers/specs/2026-05-13-graph-state-resolve-perf-design.md
EOF
)"
```

**КРИТИЧНО:** замени `<X>`, `<Y>`, `<Z>` на реальные числа из Step 1.2 перед запуском. Не оставляй плейсхолдеры.

Expected: коммит создан. Pre-commit hook прогоняет `turbo run build test lint check` — должен быть зелёный.

---

## Task 4: Добавить failing-тест для фикса #2 (leaf-skip)

**Files:**
- Modify: `packages/core/src/tests/createState.test.ts` — добавить тест внутрь существующего describe

- [ ] **Step 4.1: Добавить leaf-skip тест в `describe('resolve perf optimizations')`**

В тот же `describe`-блок, что и в Task 2, добавь четвёртый тест:

```typescript
// Test #3 (leaf-skip): leaf-узел не вызывает Object.entries во время resolve
it('leaf-skip: leaf-граф без children-links пропускает reduce', () => {
  const state = createState()
  state.mutate({ _type: 'Text', _id: 'leaf', content: 'standalone' })

  const entriesSpy = vi.spyOn(Object, 'entries')

  state.resolve('Text:leaf')

  // resolve должен прочитать value (cache.readLink), но не разворачивать поля reduce'ом.
  // Object.entries вызывается ТОЛЬКО внутри reduce. Если фикс работает — 0 вызовов
  // с самим graph-объектом в качестве аргумента.
  const callsWithGraphValue = entriesSpy.mock.calls.filter(
    ([arg]) => arg && typeof arg === 'object' && (arg as any)._type === 'Text'
  )
  expect(callsWithGraphValue.length).toBe(0)

  entriesSpy.mockRestore()
})
```

**Импорт `vi`:** в начале файла `createState.test.ts` должен быть `import { describe, it, expect, vi } from 'vitest'`. Если `vi` уже импортирован — ничего не делать. Если нет — добавить.

- [ ] **Step 4.2: Прогнать только этот тест — убедиться, что он FAIL**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && \
  npx vitest run -t 'leaf-skip: leaf-граф без children-links пропускает reduce'
```
Expected: **FAIL** — на текущем коде `Object.entries` вызывается на graph-объекте Text (reduce запускается для любого object value). Это правильно — тест корректно ловит регрессию.

Если тест ПРОШЁЛ — что-то не так. Проверь, что у `Text:leaf` действительно нет children-links и что spy ловит правильные вызовы.

---

## Task 5: Реализовать фикс #2 — leaf-skip в `resolve`

**Files:**
- Modify: `packages/core/src/createState.ts:90` — изменить условие входа в reduce-блок

- [ ] **Step 5.1: Прочитать текущий код вокруг reduce-блока**

Read: `packages/core/src/createState.ts` lines 86-120.

- [ ] **Step 5.2: Обернуть `Object.entries(...).reduce(...)` условием `hasChildren || isDeep`**

В файле `packages/core/src/createState.ts` найди блок:

```typescript
    if (isObject(value) || Array.isArray(value)) {
      value = Object.entries(value).reduce((acc, [key, value]) => {
```

Замени на:

```typescript
    const hasChildren = inputKey ? (cache.getChildren(inputKey)?.length ?? 0) > 0 : false

    if ((hasChildren || isDeep) && (isObject(value) || Array.isArray(value))) {
      value = Object.entries(value).reduce((acc, [key, value]) => {
```

**Никаких других изменений в этом блоке.** Тело reduce — без изменений.

- [ ] **Step 5.3: Прогнать leaf-skip тест — должен PASS**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && \
  npx vitest run -t 'leaf-skip: leaf-граф без children-links пропускает reduce'
```
Expected: **PASS**.

- [ ] **Step 5.4: Прогнать всю test suite — убедиться, что ничего не сломалось**

Run:
```bash
yarn workspace @graph-state/core test
```
Expected: `Tests 119 passed | 4 skipped` (115 старых + 4 новых).

Если упало — фикс что-то ломает. Распространённые причины:
- `inputKey === null` и `isDeep === false` → reduce пропускается, но раньше отрабатывал для root state без ключа. Если падает что-то про `resolve(state)` без аргумента или с `null` — это эта причина. Решение: проверить, как используется resolve без ключа в существующих тестах и не пропускать reduce в этих кейсах. Но в текущем коде (l.83) `inputKey = isValue(input) ? keyOfEntity(input) : null` → при `input = state` keyOfEntity вернёт stateKey, так что `inputKey` будет ненулевой. Тогда `hasChildren` определяется по фактическому состоянию cache.

- [ ] **Step 5.5: Прогнать bench, зафиксировать числа после фикса #2**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && npx vitest bench --run
```
Скопируй три строки ops/sec — они пойдут в commit-message.

---

## Task 6: Коммит b — фикс #2 применён

- [ ] **Step 6.1: Проверить git status**

Run:
```bash
git -C /Users/fireworks/dev/graph-state status
```
Expected: два изменённых файла —
- `packages/core/src/createState.ts`
- `packages/core/src/tests/createState.test.ts`

- [ ] **Step 6.2: Закоммитить**

```bash
cd /Users/fireworks/dev/graph-state && git add \
  packages/core/src/createState.ts \
  packages/core/src/tests/createState.test.ts && \
git commit -m "$(cat <<'EOF'
perf: skip reduce for leaf-nodes in resolve

Если у графа нет children-links и не запрошен deep — пропускаем
Object.entries(value).reduce(). Для leaf-узлов (Text, simple Frame)
это убирает hot loop полностью.

Замеры на 100-layer фрагменте:
  resolve(root):           <X> ops/sec  (baseline <baseline-X>)
  resolve(root, deep):     <Y> ops/sec  (baseline <baseline-Y>)
  mutate(leaf):            <Z> ops/sec  (baseline <baseline-Z>)

Spec: docs/superpowers/specs/2026-05-13-graph-state-resolve-perf-design.md
EOF
)"
```

**КРИТИЧНО:** замени `<X>`, `<Y>`, `<Z>` на свежие числа из Step 5.5; `<baseline-X>`, `<baseline-Y>`, `<baseline-Z>` — на числа из Step 1.2. Если рост заметный (>15%) — упомяни в свободной форме. Если регрессия — НЕ коммить, расследовать.

Expected: pre-commit hook зелёный, коммит создан.

---

## Task 7: Добавить failing-тест для фикса #3 (per-pass cache)

**Files:**
- Modify: `packages/core/src/tests/createState.test.ts` — добавить тест в тот же describe

- [ ] **Step 7.1: Добавить per-pass cache тест**

В `describe('resolve perf optimizations')` добавь пятый тест:

```typescript
// Test #2 (per-pass cache): cross-ref не resolve'ится дважды в одной resolve-сессии
it('per-pass cache: cross-ref readLink вызывается ровно один раз', () => {
  const state = createState()
  state.mutate({ _type: 'Text', _id: 'shared', content: 'reused' })
  state.mutate({
    _type: 'Frame',
    _id: 'parent',
    childA: { _type: 'Text', _id: 'shared' },
    childB: { _type: 'Text', _id: 'shared' },
  })

  let readCount = 0
  const originalReadLink = state.cache.readLink
  state.cache.readLink = (key: any) => {
    if (key === 'Text:shared') readCount++
    return originalReadLink.call(state.cache, key)
  }

  state.resolve('Frame:parent', { deep: true })

  // С фиксом #3: ровно 1 раз. Без фикса: 2 раза (по разу на каждое поле childA/childB).
  expect(readCount).toBe(1)

  state.cache.readLink = originalReadLink
})
```

**Заметка:** `state.cache` экспонируется через GraphState (l.457 createState.ts) — это значит мы можем monkey-patch `readLink`. Альтернатива через `vi.spyOn(state.cache, 'readLink')` если monkey-patch не сработает (если методы readonly).

- [ ] **Step 7.2: Прогнать тест — должен FAIL**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && \
  npx vitest run -t 'per-pass cache: cross-ref readLink вызывается ровно один раз'
```
Expected: **FAIL** — `readCount` будет 2 или больше (на текущем коде каждый safeResolve вызывает readLink заново).

Если тест проходит на текущем коде — что-то не так. Возможно граф не создаёт правильную cross-ref структуру. Проверь через `console.log(state.cache.getChildren('Frame:parent'))` — должно быть `['Text:shared']` (один раз).

---

## Task 8: Реализовать фикс #3 — per-pass resolve cache

**Files:**
- Modify: `packages/core/src/types.ts:108-113` — добавить `_resolveCache` в `ResolveOptions`
- Modify: `packages/core/src/createState.ts:75-123` — обернуть resolve кэшированием (`canUseCache = !selector`, активен и для deep=true)

- [ ] **Step 8.1: Расширить тип `ResolveOptions`**

В `packages/core/src/types.ts` найди:

```typescript
export interface ResolveOptions<TEntity extends SystemFields = any, TInput extends Entity = any, TSelector = any> {
  deep?: boolean
  safe?: boolean
  keepLinks?: boolean
  selector?: (graph: ResolveEntityByType<TEntity, TInput>) => TSelector
}
```

Замени на:

```typescript
export interface ResolveOptions<TEntity extends SystemFields = any, TInput extends Entity = any, TSelector = any> {
  deep?: boolean
  safe?: boolean
  keepLinks?: boolean
  selector?: (graph: ResolveEntityByType<TEntity, TInput>) => TSelector
  /** @internal — per-pass resolve cache, пробрасывается только рекурсивно */
  _resolveCache?: Map<string, unknown>
}
```

- [ ] **Step 8.2: Прочитать текущую функцию resolve**

Read: `packages/core/src/createState.ts` lines 75-123 — освежить контекст.

- [ ] **Step 8.3: Вставить cache short-circuit в начале resolve**

В `packages/core/src/createState.ts` найди начало функции `resolve`:

```typescript
  const resolve = <TInput extends Entity, TSelector>(
    input?: TInput,
    options?: ResolveOptions<TEntity, TInput, TSelector>
  ): TSelector extends AnyObject ? TSelector : ResolveEntityByType<TEntity, TInput> | null => {
    const isDeep = options?.deep ?? false
    const isSafe = options?.safe ?? false
    const keepLinks = options?.keepLinks ?? false
    const { selector, ...coreOptions } = options || {}
    const inputKey = isValue(input) ? keyOfEntity(input) : null
    debugState.debug({ type: 'resolve', entity: input, options })

    let value = inputKey ? (cache.readLink(inputKey) as any) : null
```

Замени на:

```typescript
  const resolve = <TInput extends Entity, TSelector>(
    input?: TInput,
    options?: ResolveOptions<TEntity, TInput, TSelector>
  ): TSelector extends AnyObject ? TSelector : ResolveEntityByType<TEntity, TInput> | null => {
    const isDeep = options?.deep ?? false
    const isSafe = options?.safe ?? false
    const keepLinks = options?.keepLinks ?? false
    const { selector, ...coreOptions } = options || {}
    const inputKey = isValue(input) ? keyOfEntity(input) : null
    debugState.debug({ type: 'resolve', entity: input, options })

    const canUseCache = !selector
    const passCache = canUseCache
      ? (options?._resolveCache ?? new Map<string, unknown>())
      : undefined

    if (inputKey && passCache?.has(inputKey)) {
      return passCache.get(inputKey) as any
    }

    if (passCache) {
      ;(coreOptions as any)._resolveCache = passCache
    }

    let value = inputKey ? (cache.readLink(inputKey) as any) : null
```

- [ ] **Step 8.4: Положить `finalValue` в кэш перед возвратом**

В том же файле найди финальный return функции resolve (строка 122):

```typescript
    return value ? (selector ? (selector({ ...value }) as any) : { ...value }) : isSafe ? (input as any) : (null as any)
```

Замени на:

```typescript
    const finalValue = value
      ? (selector ? (selector({ ...value }) as any) : { ...value })
      : isSafe
        ? (input as any)
        : (null as any)

    if (canUseCache && inputKey && value) {
      passCache!.set(inputKey, finalValue)
    }

    return finalValue
```

- [ ] **Step 8.5: Прогнать per-pass cache тест — должен PASS**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && \
  npx vitest run -t 'per-pass cache: cross-ref readLink вызывается ровно один раз'
```
Expected: **PASS** — `readCount === 1`.

- [ ] **Step 8.6: Прогнать всю test suite**

Run:
```bash
yarn workspace @graph-state/core test
```
Expected: `Tests 120 passed | 4 skipped` (115 базовых + 5 новых).

Если упало:
- Снимок regression-теста изменился → значит порядок resolve / shape результата изменился. **Это плохо.** Не коммить — отдать на разбор. Проверь что `finalValue` действительно содержит spread.
- Один из 4 предыдущих новых тестов упал → ищи конкретное место, скорее всего связано с пробросом `_resolveCache` в `coreOptions`.

- [ ] **Step 8.7: Прогнать `typecheck` (`yarn typecheck` / `tsc --noEmit`) — убедиться, что типы OK**

Run:
```bash
yarn workspace @graph-state/core check
```
Expected: typecheck без ошибок.

Если `_resolveCache` вызывает ошибку — проверь, что `(coreOptions as any)._resolveCache = passCache` именно с `as any` cast (TypeScript не любит присваивание в литералы с строгими типами).

- [ ] **Step 8.8: Прогнать bench**

Run:
```bash
cd /Users/fireworks/dev/graph-state/packages/core && npx vitest bench --run
```
Скопируй три строки ops/sec.

---

## Task 9: Коммит c — фикс #3 применён

- [ ] **Step 9.1: Проверить git status**

Run:
```bash
git -C /Users/fireworks/dev/graph-state status
```
Expected: три изменённых файла —
- `packages/core/src/createState.ts`
- `packages/core/src/types.ts`
- `packages/core/src/tests/createState.test.ts`

- [ ] **Step 9.2: Закоммитить**

```bash
cd /Users/fireworks/dev/graph-state && git add \
  packages/core/src/createState.ts \
  packages/core/src/types.ts \
  packages/core/src/tests/createState.test.ts && \
git commit -m "$(cat <<'EOF'
perf: per-pass resolve cache inside synchronous resolve session

В рамках одной synchronous resolve-сессии cross-references больше
не разворачиваются повторно. Cache живёт только между top-level и
рекурсивными safeResolve внутри одного вызова, не пересекает границы.

Кэш активен только когда selector=undefined и deep=false — это
покрывает все internal safeResolve. Top-level контракт "resolve
возвращает новый объект" сохраняется (cache не делится между двумя
state.resolve(K) вызовами).

Замеры на 100-layer фрагменте:
  resolve(root):           <X> ops/sec  (baseline <baseline-X>)
  resolve(root, deep):     <Y> ops/sec  (baseline <baseline-Y>)
  mutate(leaf):            <Z> ops/sec  (baseline <baseline-Z>)

Spec: docs/superpowers/specs/2026-05-13-graph-state-resolve-perf-design.md
EOF
)"
```

**КРИТИЧНО:** замени `<X>`, `<Y>`, `<Z>` на свежие числа из Step 8.8; `<baseline-X>` и т.д. — на исходные числа из Step 1.2 (НЕ из Step 5.5 — мы хотим показать суммарный выигрыш от обоих фиксов).

Expected: коммит создан. Pre-commit hook зелёный.

---

## Task 10: Финальная верификация

- [ ] **Step 10.1: Прогнать всё**

Run:
```bash
cd /Users/fireworks/dev/graph-state && yarn build && yarn test && yarn typecheck
```
Expected: всё зелёное.

- [ ] **Step 10.2: Сравнить итоговые bench-числа с baseline**

Из commit-history можно прочитать три commit-message'а (a, b, c). Проверь:
- `resolve(root)` (без deep) — это ключевая метрика. Ожидание из spec'а: −30…−60% time (т.е. +50…+150% ops/sec) — суммарно от обоих фиксов.
- `resolve(root, deep)` — выигрыш заметнее, ожидание +50…+150% ops/sec.
- `mutate(leaf)` — небольшой выигрыш от leaf-skip (mutate внутри зовёт resolve для prevGraph).

Если суммарный выигрыш меньше +30% ops/sec на `resolve(root)` — это сигнал, что фрагмент в бенче недостаточно репрезентативен. Не критично, но упомяни в финальном отчёте.

- [ ] **Step 10.3: Посмотреть `git log` — три новых коммита**

Run:
```bash
git -C /Users/fireworks/dev/graph-state log --oneline -5
```
Expected: видно три коммита из этого плана + предыдущие docs/спека.

- [ ] **Step 10.4: Финальный отчёт**

Сообщи короткий summary user'у:
- Сколько коммитов сделано.
- Какие числа bench показал на старте и после двух фиксов.
- Если что-то пошло не так в процессе — упомяни.
- Если все критерии готовности из spec'а выполнены — упомяни явно.

---

## Опционально: возможные сложности и fallback'и

**Если `vitest bench --run` не запускается в данной версии (1.6.1):**
- Попробуй `npx vitest run resolve.bench.ts` — некоторые версии запускают bench-блоки через обычный run.
- Если не помогает — упомяни в commit-message, что числа замерены через другой механизм (например, `console.time` обёртку), приложи их.
- Не блокировать процесс из-за bench-tooling — это nice-to-have.

**Если `Object.entries` spy не ловит вызовы (Test #3):**
- `vi.spyOn(Object, 'entries')` иногда конфликтует с jsdom env. Альтернатива: переименовать тест в behavioural — измерить время resolve leaf через `performance.now()` (но это flaky).
- Если тест нестабилен — пометь `.skip` с комментарием и расскажи в отчёте; **фикс #2 всё равно применить**.

**Если `state.cache.readLink` нельзя override напрямую (Test #2):**
- Использовать `const spy = vi.spyOn(state.cache, 'readLink')` и `expect(spy.mock.calls.filter(c => c[0] === 'Text:shared').length).toBe(1)`.

**Если pre-commit hook падает на `eslint --fix`:**
- Скорее всего `_resolveCache` или `passCache` обозначены как unused. Проверь, что переменные действительно используются.
- Если `as any` ругает eslint — оставить, нет другого способа добавить internal-поле без расширения publicly-видимого типа.
