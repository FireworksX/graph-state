import { describe, it, expect } from 'vitest'
import { inspectFieldsTest } from './tests/createState/inspectFields.test'
import { resolveTest } from './tests/createState/resolve.test'
import { buildLinksTest } from './tests/createState/buildLinks.test'
import { mutateTest } from './tests/createState/mutate.test'
import { invalidateTest } from './tests/createState/invalidate.test'
import { observeNotifyTest } from './tests/createState/observeNotify.test'
import { keyOfEntityTest } from './tests/createState/keyOfEntity.test'
import { entityOfKeyTest } from './tests/createState/entityOfKey.test'
import { resolveParentsTest } from './tests/createState/resolveParents.test'
import { createStateTest } from './tests/createState/createState.test'
import { pluginsTest } from './tests/createState/plugins.test'

describe('createState', () => {
  createStateTest()
  keyOfEntityTest()
  entityOfKeyTest()
  inspectFieldsTest()
  resolveTest()
  buildLinksTest()
  mutateTest()
  invalidateTest()
  observeNotifyTest()
  resolveParentsTest()
  pluginsTest()
})
