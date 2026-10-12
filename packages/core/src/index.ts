/**
 * @ui/core — public entry point.
 *
 * Order of exports is intentional:
 *   1. Types first (zero runtime cost).
 *   2. Foundation primitives (CleanupRegistry, attribute helpers).
 *   3. Observer manager.
 *   4. The BaseElement class itself.
 *   5. `define()` wrapper.
 *   6. Event / responsive helpers.
 */

export type {
  BaseElementHooks,
  CleanupTask,
  Disposer,
  Parser,
  PropertyDef,
  PropertyDefMap,
  PropertyType,
  Serializer,
} from './types.js';

export { CleanupRegistry } from './cleanup.js';

export {
  applyDefaults,
  camel,
  coerce,
  getParser,
  getSerializer,
  kebab,
  observedAttrsFor,
  parseBoolean,
  parseObject,
  parseNumber,
  parseString,
  reflect,
  serializeBoolean,
  serializeNumber,
  serializeObject,
  serializeString,
  // Frame helpers
  afterPaint,
  cancelAfterPaint,
  nextTick,
} from './attributes.js';

export {
  emit,
  on,
  once,
} from './events.js';

export {
  getObserverManager,
  ObserverManager,
  setObserverConstructors,
  _resetObserverManagerForTests,
} from './observer.js';
export type {
  IntersectionObserveOptions,
  ResizeObserveOptions,
} from './observer.js';

export {
  currentBreakpoint,
  getBreakpointState,
  onBreakpointChange,
} from './responsive.js';
export type { BreakpointState } from './responsive.js';

export { BaseElement, type BaseElementType } from './element.js';

export {
  define,
  forgetForTests,
  getAllRegistered,
  getRegistered,
  getTagNames,
  isDefined,
  isSupported,
} from './define.js';
export type { RegisteredComponent } from './define.js';

export { isDevMode } from './dev.js';