/**
 * Shared types for @ui/core.
 * Zero runtime cost — type-only module.
 */

/** Properties that BaseElement can reflect between attribute ↔ property. */
export type PropertyType = 'string' | 'number' | 'boolean' | 'object';

/** Function called to coerce a raw attribute string into a typed value. */
export type Parser<T> = (raw: string | null) => T;

/** Function called to serialise a typed value back to an attribute string. */
export type Serializer<T> = (value: T) => string | null;

export interface PropertyDef<T = unknown> {
  /** The JS property name (camelCase). */
  readonly name: string;
  /** The HTML attribute name (kebab-case). Defaults to the kebab-case of `name`. */
  readonly attr?: string;
  /** Default value applied when the attribute is absent. */
  readonly default: T;
  /** Optional explicit parser; otherwise inferred from `type`. */
  readonly parse?: Parser<T>;
  readonly serialize?: Serializer<T>;
  /** Reflect property → attribute automatically. Default false except for boolean flags. */
  readonly reflect?: boolean;
  /**
   * If true, the property is read-only after construction. Useful for derived state
   * that consumers should not mutate directly.
   */
  readonly readonly?: boolean;
}

export type PropertyDefMap = Record<string, PropertyDef<unknown>>;

/**
 * Hook signatures subclasses may implement. These are called by BaseElement at
 * specific lifecycle moments. All are optional.
 */
export interface BaseElementHooks {
  /** Called once after the first paint following the first `connectedCallback`. */
  onReady?(): void;
  /** Called every time the element is attached to the DOM. */
  onConnect?(): void;
  /** Called every time the element is removed from the DOM. */
  onDisconnect?(): void;
  /** Called when the element is moved between documents. */
  onAdopted?(): void;
  /** Called when a reflected attribute changes (and after the property is updated). */
  onAttributeChanged?(name: string, oldValue: string | null, newValue: string | null): void;
}

/** A disposable that removes whatever it was registered for. */
export type Disposer = () => void;

/** A teardown function registered with a CleanupRegistry. */
export type CleanupTask = () => void;