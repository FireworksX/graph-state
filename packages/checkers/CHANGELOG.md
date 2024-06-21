# @graph-state/core

## 0.1.0

### Minor Changes

- af38861: Init

## 0.6.0

### Minor Changes

- 3619862: Added deep resolve options

### Patch Changes

- 0d1ba14: Use overrideMutateMethod option.
- 89ae6d3: Pass invalid entity to resolve for get null.

## 0.5.0

### Minor Changes

- 757f06c: Graph state have own state. Update useGraph hook.

### Patch Changes

- 388fbee: Removed the deletion of subscribers upon invalidation
- 9fe75c1: Implement deep detection updates for mutation.
- 4228c86: Add dedup option to mutate

## 0.4.0

### Minor Changes

- 043db75: Add GarbageCollector for links

### Patch Changes

- d4e81d0: Add extend plugin. Core method getArgumentsForMutate return computed data.

## 0.3.1

### Patch Changes

- 6c8b8d2: Remove link after invalidation. Fix re-render useInspectFields.
- a315338: Export utils
- 745f7f1: Fix inspectField to return new link

## 0.3.0

### Minor Changes

- 6cd0030: Update link base structure. Add batch update.

### Patch Changes

- 05f88d0: Add types for inspectFields
- 4abe615: Skip not changing mutation (primitives only)
- 2b8e8c7: useGraph:

  - Changed the structure of the useGraph hook, now it returns a tuple of `[value, setter]`.
  - Vitest configure & added base tests.

  Core:

  - Added new types

## 0.2.0

### Minor Changes

- dec27b3: Integrate ESLint. Update refs system for links.
- e9f5f73: Add keying map for entities

### Patch Changes

- e9f5f73: Remove link ref if her is empty
- b7ae94b: Make getArgumentsForMutate as static method.

## 0.1.8

### Patch Changes

- f2a43a7: Test full pipeline

## 0.1.4

### Patch Changes

- 05838cc: ddd

## 0.1.3

### Patch Changes

- 34c3395: 11

## 0.1.2

### Patch Changes

- 063d5cb: 11

## 0.1.1

### Patch Changes

- 1112c57: Upd
- 43ca9c8: 123
- 1437243: fdsfg
- b2b9a74: dff
- fec21e3: 111
- 6051d61: Fix tests and rename to GraphState
- a0fe12c: 123
